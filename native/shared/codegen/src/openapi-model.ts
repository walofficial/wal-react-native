/**
 * Language-neutral intermediate model built from `openapi.json`.
 * Both the Swift and Kotlin emitters consume this so the two native cores stay
 * structurally identical (same type names, same property names, same operations).
 */
import fs from 'node:fs';

export type JsonSchema = Record<string, any>;

export type TypeRef =
  | { kind: 'string'; format?: string }
  | { kind: 'number' }
  | { kind: 'integer' }
  | { kind: 'boolean' }
  | { kind: 'any' }
  | { kind: 'file' }
  | { kind: 'array'; items: TypeRef }
  | { kind: 'map'; values: TypeRef }
  | { kind: 'ref'; name: string }
  | { kind: 'enum'; name: string; values: string[] }
  | { kind: 'object'; name: string };

export interface Property {
  /** Wire name (snake_case as sent by the server). */
  wireName: string;
  /** Identifier-safe camelCase name. */
  name: string;
  type: TypeRef;
  optional: boolean;
  nullable: boolean;
  description?: string;
}

export interface ObjectType {
  kind: 'object';
  name: string;
  properties: Property[];
  additionalProperties?: TypeRef;
  description?: string;
  /** Marked when at least one multipart operation uses this type as body. */
  multipart: boolean;
}

export interface EnumType {
  kind: 'enum';
  name: string;
  values: string[];
  description?: string;
}

export interface AliasType {
  kind: 'alias';
  name: string;
  type: TypeRef;
  description?: string;
}

export type NamedType = ObjectType | EnumType | AliasType;

export interface Parameter {
  wireName: string;
  name: string;
  type: TypeRef;
  required: boolean;
  description?: string;
}

export interface OperationModel {
  operationId: string;
  typeName: string;
  method: string;
  pathTemplate: string;
  tag: string;
  pathParams: Parameter[];
  queryParams: Parameter[];
  headerParams: Parameter[];
  body?: { type: TypeRef; required: boolean; multipart: boolean };
  response?: TypeRef;
  description?: string;
}

export interface ApiModel {
  types: NamedType[];
  operations: OperationModel[];
}

const IDENT_CLEAN = /[^A-Za-z0-9_]/g;

export function camel(wire: string): string {
  const parts = wire.replace(IDENT_CLEAN, '_').split('_').filter(Boolean);
  if (parts.length === 0) return 'value';
  const [first, ...rest] = parts;
  const out = first.charAt(0).toLowerCase() + first.slice(1) + rest.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  return /^[0-9]/.test(out) ? `_${out}` : out;
}

export function pascal(wire: string): string {
  const c = camel(wire);
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export class ModelBuilder {
  readonly types = new Map<string, NamedType>();
  private readonly doc: JsonSchema;

  constructor(openapiPath: string) {
    this.doc = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
  }

  build(): ApiModel {
    const schemas: Record<string, JsonSchema> = this.doc.components?.schemas ?? {};
    for (const [name, schema] of Object.entries(schemas)) this.registerNamed(name, schema);

    const operations: OperationModel[] = [];
    for (const [pathTemplate, methods] of Object.entries<Record<string, JsonSchema>>(this.doc.paths ?? {})) {
      for (const [method, op] of Object.entries(methods)) {
        operations.push(this.buildOperation(pathTemplate, method, op));
      }
    }
    operations.sort((a, b) => a.operationId.localeCompare(b.operationId));
    const types = [...this.types.values()].sort((a, b) => a.name.localeCompare(b.name));
    return { types, operations };
  }

  private registerNamed(name: string, schema: JsonSchema): TypeRef {
    const existing = this.types.get(name);
    if (existing) return existing.kind === 'enum' ? { kind: 'enum', name, values: existing.values } : { kind: 'ref', name };

    const { nullable, inner } = unwrapNullable(schema);
    if (inner.type === 'string' && Array.isArray(inner.enum)) {
      const e: EnumType = { kind: 'enum', name, values: inner.enum as string[], description: inner.description };
      this.types.set(name, e);
      return { kind: 'enum', name, values: e.values };
    }
    if (inner.type === 'object' && inner.properties) {
      const obj: ObjectType = { kind: 'object', name, properties: [], description: inner.description, multipart: false };
      this.types.set(name, obj); // register before recursing to allow cycles
      const required = new Set<string>(inner.required ?? []);
      const seen = new Set<string>();
      for (const [wireName, propSchema] of Object.entries<JsonSchema>(inner.properties)) {
        let ident = camel(wireName);
        while (seen.has(ident)) ident = `${ident}_`;
        seen.add(ident);
        const { nullable: propNullable, inner: propInner } = unwrapNullable(propSchema);
        obj.properties.push({
          wireName,
          name: ident,
          type: this.typeRef(propInner, `${name}${pascal(wireName)}`),
          optional: !required.has(wireName),
          nullable: propNullable,
          description: propSchema.description ?? propSchema.title,
        });
      }
      if (inner.additionalProperties && typeof inner.additionalProperties === 'object') {
        obj.additionalProperties = this.typeRef(inner.additionalProperties, `${name}Value`);
      }
      return { kind: 'ref', name };
    }
    const alias: AliasType = { kind: 'alias', name, type: { kind: 'any' }, description: inner.description };
    this.types.set(name, alias);
    alias.type = this.typeRef(inner, name);
    void nullable;
    return { kind: 'ref', name };
  }

  /** Resolves a schema into a TypeRef, hoisting inline objects/enums into named types. */
  typeRef(schema: JsonSchema, hoistName: string): TypeRef {
    if (!schema || Object.keys(schema).length === 0) return { kind: 'any' };
    if (schema.$ref) {
      const name = String(schema.$ref).split('/').pop()!;
      const target = this.types.get(name);
      if (target?.kind === 'enum') return { kind: 'enum', name, values: target.values };
      return { kind: 'ref', name };
    }
    const { inner } = unwrapNullable(schema);
    if (inner !== schema) return this.typeRef(inner, hoistName);
    if (Array.isArray(schema.anyOf) || Array.isArray(schema.oneOf) || Array.isArray(schema.allOf)) return { kind: 'any' };
    switch (schema.type) {
      case 'string':
        if (schema.format === 'binary') return { kind: 'file' };
        if (Array.isArray(schema.enum)) {
          if (!this.types.has(hoistName)) {
            this.types.set(hoistName, { kind: 'enum', name: hoistName, values: schema.enum, description: schema.description });
          }
          return { kind: 'enum', name: hoistName, values: schema.enum };
        }
        return { kind: 'string', format: schema.format };
      case 'number':
        return { kind: 'number' };
      case 'integer':
        return { kind: 'integer' };
      case 'boolean':
        return { kind: 'boolean' };
      case 'array': {
        if (Array.isArray(schema.prefixItems)) {
          const first = schema.prefixItems[0] ?? {};
          return { kind: 'array', items: this.typeRef(first, `${hoistName}Item`) };
        }
        return { kind: 'array', items: this.typeRef(schema.items ?? {}, `${hoistName}Item`) };
      }
      case 'object':
        if (schema.properties) {
          this.registerNamed(hoistName, schema);
          return { kind: 'object', name: hoistName };
        }
        if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
          return { kind: 'map', values: this.typeRef(schema.additionalProperties, `${hoistName}Value`) };
        }
        return { kind: 'map', values: { kind: 'any' } };
      case 'null':
        return { kind: 'any' };
      default:
        return { kind: 'any' };
    }
  }

  private buildOperation(pathTemplate: string, method: string, op: JsonSchema): OperationModel {
    const operationId: string = op.operationId;
    const typeName = pascal(operationId);
    const params: Parameter[] = (op.parameters ?? []).map((p: JsonSchema) => {
      const { inner } = unwrapNullable(p.schema ?? {});
      return {
        wireName: p.name,
        name: camel(p.name),
        type: this.typeRef(inner, `${typeName}${pascal(p.name)}`),
        required: !!p.required,
        description: p.description,
        location: p.in,
      } as Parameter & { location: string };
    });
    const byLoc = (loc: string) => params.filter((p) => (p as Parameter & { location: string }).location === loc);

    let body: OperationModel['body'];
    if (op.requestBody?.content) {
      const [mediaType, media] = Object.entries<JsonSchema>(op.requestBody.content)[0];
      const multipart = mediaType.startsWith('multipart/');
      const type = this.typeRef(media.schema ?? {}, `${typeName}Body`);
      if (multipart && (type.kind === 'ref' || type.kind === 'object')) {
        const t = this.types.get(type.name);
        if (t?.kind === 'object') t.multipart = true;
      }
      body = { type, required: !!op.requestBody.required, multipart };
    }

    let response: TypeRef | undefined;
    const ok = op.responses?.['200'] ?? op.responses?.['201'];
    const okSchema = ok?.content?.['application/json']?.schema;
    if (okSchema) response = this.typeRef(okSchema, `${typeName}Response`);

    return {
      operationId,
      typeName,
      method: method.toUpperCase(),
      pathTemplate,
      tag: (op.tags ?? ['root'])[0],
      pathParams: byLoc('path'),
      queryParams: byLoc('query'),
      headerParams: byLoc('header'),
      body,
      response,
      description: op.summary ?? op.description,
    };
  }
}

export function unwrapNullable(schema: JsonSchema): { nullable: boolean; inner: JsonSchema } {
  const variants: JsonSchema[] | undefined = schema.anyOf ?? schema.oneOf;
  if (Array.isArray(variants)) {
    const nonNull = variants.filter((v) => v.type !== 'null');
    const hasNull = nonNull.length !== variants.length;
    if (hasNull && nonNull.length === 1) {
      const { title, description } = schema;
      return { nullable: true, inner: { ...nonNull[0], ...(title ? { title } : {}), ...(description ? { description } : {}) } };
    }
    if (hasNull && nonNull.length === 0) return { nullable: true, inner: {} };
  }
  if (schema.nullable === true) {
    const { nullable, ...rest } = schema;
    return { nullable: true, inner: rest };
  }
  return { nullable: false, inner: schema };
}
