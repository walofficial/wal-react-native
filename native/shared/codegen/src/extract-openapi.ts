/**
 * Reconstructs an OpenAPI 3.1 document from the hey-api generated TypeScript
 * (`lib/api/generated/types.gen.ts` + `sdk.gen.ts`) of the React Native app.
 *
 * The backend (wal-server) does not commit its `openapi.json`, so this is the
 * shared contract both native cores generate their clients from. When the real
 * document is available, drop it at `native/shared/api/openapi.json`; the
 * downstream generators only depend on the OpenAPI shape produced here
 * (FastAPI-style `anyOf: [T, {type: "null"}]` for optionals, `$ref` schemas).
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { OPENAPI_JSON, RN_SDK_GEN, RN_TYPES_GEN } from './paths.js';

type JsonSchema = Record<string, unknown>;

interface SdkOperation {
  operationId: string;
  method: string;
  url: string;
  multipart: boolean;
}

interface Operation extends SdkOperation {
  dataType?: ts.TypeAliasDeclaration;
  responsesType?: ts.TypeAliasDeclaration;
  errorsType?: ts.TypeAliasDeclaration;
}

const OPERATION_SUFFIXES = ['Data', 'Responses', 'Response', 'Errors', 'Error'] as const;

function readSdkOperations(sdkFile: ts.SourceFile): SdkOperation[] {
  const ops: SdkOperation[] = [];
  sdkFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const decl of node.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
      const text = decl.initializer.getText(sdkFile);
      const methodMatch = text.match(/\)\.(get|post|put|patch|delete|head|options)</);
      const urlMatch = text.match(/url:\s*'([^']+)'/);
      if (!methodMatch || !urlMatch) continue;
      ops.push({
        operationId: decl.name.text,
        method: methodMatch[1],
        url: urlMatch[1],
        multipart: text.includes('formDataBodySerializer'),
      });
    }
  });
  return ops;
}

class SchemaBuilder {
  readonly components = new Map<string, JsonSchema>();
  private readonly aliases = new Map<string, ts.TypeAliasDeclaration>();

  constructor(private readonly typesFile: ts.SourceFile) {
    typesFile.forEachChild((node) => {
      if (ts.isTypeAliasDeclaration(node)) this.aliases.set(node.name.text, node);
    });
  }

  get aliasNames(): string[] {
    return [...this.aliases.keys()];
  }

  alias(name: string): ts.TypeAliasDeclaration | undefined {
    return this.aliases.get(name);
  }

  docOf(node: ts.Node): { title?: string; description?: string } {
    const ranges = ts.getLeadingCommentRanges(this.typesFile.getFullText(), node.getFullStart()) ?? [];
    const lines: string[] = [];
    for (const r of ranges) {
      const raw = this.typesFile.getFullText().slice(r.pos, r.end);
      for (const line of raw.split('\n')) {
        const cleaned = line.replace(/^\s*\/\*\*?/, '').replace(/\*\/\s*$/, '').replace(/^\s*\*\s?/, '').trim();
        if (cleaned) lines.push(cleaned);
      }
    }
    if (lines.length === 0) return {};
    if (lines.length === 1) return { title: lines[0] };
    return { title: lines[0], description: lines.slice(1).join('\n') };
  }

  /** Converts a TS type node to a JSON schema. `undefined` means `never`. */
  schemaFor(node: ts.TypeNode): JsonSchema | undefined {
    switch (node.kind) {
      case ts.SyntaxKind.StringKeyword:
        return { type: 'string' };
      case ts.SyntaxKind.NumberKeyword:
        return { type: 'number' };
      case ts.SyntaxKind.BooleanKeyword:
        return { type: 'boolean' };
      case ts.SyntaxKind.NullKeyword:
        return { type: 'null' };
      case ts.SyntaxKind.UnknownKeyword:
      case ts.SyntaxKind.AnyKeyword:
        return {};
      case ts.SyntaxKind.NeverKeyword:
        return undefined;
      case ts.SyntaxKind.UndefinedKeyword:
        return undefined;
    }
    if (ts.isLiteralTypeNode(node)) {
      const lit = node.literal;
      if (lit.kind === ts.SyntaxKind.NullKeyword) return { type: 'null' };
      if (ts.isStringLiteral(lit)) return { type: 'string', enum: [lit.text] };
      if (ts.isNumericLiteral(lit)) return { type: 'number', enum: [Number(lit.text)] };
      if (lit.kind === ts.SyntaxKind.TrueKeyword) return { type: 'boolean', enum: [true] };
      if (lit.kind === ts.SyntaxKind.FalseKeyword) return { type: 'boolean', enum: [false] };
    }
    if (ts.isParenthesizedTypeNode(node)) return this.schemaFor(node.type);
    if (ts.isArrayTypeNode(node)) {
      return { type: 'array', items: this.schemaFor(node.elementType) ?? {} };
    }
    if (ts.isTupleTypeNode(node)) {
      const items = node.elements.map((e) => this.schemaFor(ts.isNamedTupleMember(e) ? e.type : e) ?? {});
      return { type: 'array', prefixItems: items, minItems: items.length, maxItems: items.length };
    }
    if (ts.isTypeReferenceNode(node)) {
      const name = node.typeName.getText(this.typesFile);
      if (name === 'Array' && node.typeArguments?.length === 1) {
        return { type: 'array', items: this.schemaFor(node.typeArguments[0]) ?? {} };
      }
      if (name === 'Record' && node.typeArguments?.length === 2) {
        return { type: 'object', additionalProperties: this.schemaFor(node.typeArguments[1]) ?? {} };
      }
      if (name === 'Blob' || name === 'File') return { type: 'string', format: 'binary' };
      if (name === 'Date') return { type: 'string', format: 'date-time' };
      if (this.aliases.has(name)) return { $ref: `#/components/schemas/${name}` };
      return {};
    }
    if (ts.isTypeLiteralNode(node)) {
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      let additionalProperties: JsonSchema | undefined;
      for (const member of node.members) {
        if (ts.isIndexSignatureDeclaration(member)) {
          additionalProperties = this.schemaFor(member.type) ?? {};
          continue;
        }
        if (!ts.isPropertySignature(member) || !member.type) continue;
        const key = ts.isIdentifier(member.name) || ts.isStringLiteral(member.name)
          ? member.name.text
          : member.name.getText(this.typesFile);
        const schema = this.schemaFor(member.type);
        if (schema === undefined) continue; // `never` members (e.g. `body?: never`)
        properties[key] = { ...schema, ...this.docOf(member) };
        if (!member.questionToken) required.push(key);
      }
      const out: JsonSchema = { type: 'object', properties };
      if (required.length) out.required = required;
      if (additionalProperties) out.additionalProperties = additionalProperties;
      return out;
    }
    if (ts.isUnionTypeNode(node)) {
      const parts = node.types.map((t) => this.schemaFor(t)).filter((s): s is JsonSchema => s !== undefined);
      // Merge string-literal enums into a single enum schema.
      const allStringEnums = parts.every((p) => p.type === 'string' && Array.isArray(p.enum));
      if (allStringEnums && parts.length > 0) {
        return { type: 'string', enum: parts.flatMap((p) => p.enum as string[]) };
      }
      // `Blob | File` both map to binary strings; dedupe structurally identical variants.
      const unique = parts.filter((p, i) => parts.findIndex((q) => JSON.stringify(q) === JSON.stringify(p)) === i);
      const nonNull = unique.filter((p) => p.type !== 'null');
      const hasNull = nonNull.length !== unique.length;
      if (nonNull.length === 1 && hasNull) return { anyOf: [nonNull[0], { type: 'null' }] };
      if (nonNull.length === 1) return nonNull[0];
      return { anyOf: unique };
    }
    if (ts.isIntersectionTypeNode(node)) {
      const parts = node.types.map((t) => this.schemaFor(t)).filter((s): s is JsonSchema => s !== undefined);
      // `string & {}` idiom → string
      if (parts.length === 2 && parts.some((p) => p.type === 'string') && parts.some((p) => p.type === 'object' && !p.properties)) {
        return { type: 'string' };
      }
      return { allOf: parts };
    }
    if (ts.isIndexedAccessTypeNode(node) || ts.isTypeOperatorNode(node) || ts.isMappedTypeNode(node)) {
      return {};
    }
    return {};
  }
}

function isOperationDerivedName(name: string, operationIds: Set<string>, alias?: ts.TypeAliasDeclaration): boolean {
  // hey-api emits `XData`, `XResponses`, `XErrors` as type literals and `XResponse` / `XError` as
  // indexed-access aliases (`XResponses[keyof XResponses]`). When the server already has a model named
  // `XResponse`, the derived alias is renamed `XResponse2`. Only the derived ones must be dropped.
  const structural = name.replace(/2$/, '');
  for (const suffix of OPERATION_SUFFIXES) {
    if (!structural.endsWith(suffix)) continue;
    const base = structural.slice(0, -suffix.length);
    const opId = base.charAt(0).toLowerCase() + base.slice(1);
    if (!operationIds.has(opId)) continue;
    if (suffix === 'Data' || suffix === 'Responses' || suffix === 'Errors') return true;
    if (!alias) return true;
    return ts.isIndexedAccessTypeNode(alias.type) || name.endsWith('2');
  }
  return false;
}

function pascal(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function statusSchemas(builder: SchemaBuilder, alias: ts.TypeAliasDeclaration | undefined): Record<string, { description?: string; schema?: JsonSchema }> {
  const out: Record<string, { description?: string; schema?: JsonSchema }> = {};
  if (!alias || !ts.isTypeLiteralNode(alias.type)) return out;
  for (const member of alias.type.members) {
    if (!ts.isPropertySignature(member) || !member.type) continue;
    const status = member.name.getText(builder['typesFile']).replace(/['"]/g, '');
    const schema = builder.schemaFor(member.type);
    const doc = builder.docOf(member);
    out[status] = { description: doc.description ?? doc.title ?? 'Response', schema: schema && Object.keys(schema).length ? schema : undefined };
  }
  return out;
}

function buildParameters(builder: SchemaBuilder, dataAlias: ts.TypeAliasDeclaration | undefined) {
  const parameters: JsonSchema[] = [];
  let requestBody: JsonSchema | undefined;
  if (!dataAlias || !ts.isTypeLiteralNode(dataAlias.type)) return { parameters, requestBody };
  for (const member of dataAlias.type.members) {
    if (!ts.isPropertySignature(member) || !member.type) continue;
    const key = member.name.getText(builder['typesFile']);
    if (key === 'url') continue;
    if (key === 'body') {
      const schema = builder.schemaFor(member.type);
      if (schema) requestBody = { required: !member.questionToken, schema };
      continue;
    }
    const location = key === 'path' ? 'path' : key === 'query' ? 'query' : key === 'headers' ? 'header' : undefined;
    if (!location) continue;
    const schema = builder.schemaFor(member.type);
    if (!schema || schema.type !== 'object' || !schema.properties) continue;
    const props = schema.properties as Record<string, JsonSchema>;
    const required = new Set((schema.required as string[] | undefined) ?? []);
    for (const [name, propSchema] of Object.entries(props)) {
      const { title, description, ...rest } = propSchema as JsonSchema & { title?: string; description?: string };
      parameters.push({
        name,
        in: location,
        required: location === 'path' ? true : required.has(name),
        ...(description || title ? { description: description ?? title } : {}),
        schema: rest,
      });
    }
  }
  return { parameters, requestBody };
}

export function extractOpenApi(): JsonSchema {
  const program = ts.createProgram([RN_TYPES_GEN, RN_SDK_GEN], { noResolve: true, allowJs: false });
  const typesFile = program.getSourceFile(RN_TYPES_GEN);
  const sdkFile = program.getSourceFile(RN_SDK_GEN);
  if (!typesFile || !sdkFile) throw new Error('Could not load generated RN API files');

  const builder = new SchemaBuilder(typesFile);
  const sdkOps = readSdkOperations(sdkFile);
  const operationIds = new Set(sdkOps.map((o) => o.operationId));

  const operations: Operation[] = sdkOps.map((op) => {
    const base = pascal(op.operationId);
    return {
      ...op,
      dataType: builder.alias(`${base}Data`),
      responsesType: builder.alias(`${base}Responses`),
      errorsType: builder.alias(`${base}Errors`),
    };
  });

  // Component schemas: every alias that is not operation-derived.
  const schemas: Record<string, JsonSchema> = {};
  for (const name of builder.aliasNames) {
    const alias = builder.alias(name)!;
    if (name === 'ClientOptions' || isOperationDerivedName(name, operationIds, alias)) continue;
    const schema = builder.schemaFor(alias.type) ?? {};
    schemas[name] = { ...schema, ...builder.docOf(alias), title: builder.docOf(alias).title ?? name };
  }

  const paths: Record<string, Record<string, JsonSchema>> = {};
  for (const op of operations) {
    const { parameters, requestBody } = buildParameters(builder, op.dataType);
    const responses: Record<string, JsonSchema> = {};
    for (const [status, r] of Object.entries(statusSchemas(builder, op.responsesType))) {
      responses[status] = r.schema
        ? { description: r.description, content: { 'application/json': { schema: r.schema } } }
        : { description: r.description };
    }
    for (const [status, r] of Object.entries(statusSchemas(builder, op.errorsType))) {
      responses[status] = r.schema
        ? { description: r.description, content: { 'application/json': { schema: r.schema } } }
        : { description: r.description };
    }
    const operationObject: JsonSchema = {
      operationId: op.operationId,
      tags: [op.url.split('/')[1] || 'root'],
      ...(parameters.length ? { parameters } : {}),
      ...(requestBody
        ? {
            requestBody: {
              required: requestBody.required,
              content: { [op.multipart ? 'multipart/form-data' : 'application/json']: { schema: requestBody.schema } },
            },
          }
        : {}),
      responses,
    };
    paths[op.url] ??= {};
    paths[op.url][op.method] = operationObject;
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'WAL API',
      version: 'reconstructed-from-rn-generated-client',
      description:
        'Reconstructed from lib/api/generated/{types,sdk}.gen.ts of the React Native app. Replace with the wal-server openapi.json when available.',
    },
    servers: [{ url: 'http://localhost:5500' }],
    paths,
    components: { schemas },
  };
}

function main() {
  const doc = extractOpenApi();
  fs.mkdirSync(path.dirname(OPENAPI_JSON), { recursive: true });
  fs.writeFileSync(OPENAPI_JSON, JSON.stringify(doc, null, 2) + '\n');
  const opCount = Object.values(doc.paths as Record<string, object>).reduce((n, p) => n + Object.keys(p).length, 0);
  console.log(
    `openapi.json: ${opCount} operations, ${Object.keys((doc.components as { schemas: object }).schemas).length} schemas -> ${path.relative(process.cwd(), OPENAPI_JSON)}`,
  );
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main();
