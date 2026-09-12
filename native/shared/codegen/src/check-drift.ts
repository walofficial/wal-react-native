/**
 * Drift check for CI: regenerates every derived artifact in memory and fails when the committed
 * files differ. Guarantees openapi.json, tokens.json, routes.json and the locale files stay the
 * single source of truth for the Swift (and later Kotlin) cores.
 */
import fs from 'node:fs';
import path from 'node:path';
import { extractOpenApi } from './extract-openapi.js';
import { generateSwift } from './gen-swift.js';
import { OPENAPI_JSON, REPO_ROOT, RN_LOCALES_DIR, SWIFT_CORE_RESOURCES_LOCALES_DIR } from './paths.js';

interface Drift { file: string; reason: string }

function compare(file: string, expected: string, drifts: Drift[]): void {
  if (!fs.existsSync(file)) {
    drifts.push({ file, reason: 'missing (run `npm run gen`)' });
    return;
  }
  const actual = fs.readFileSync(file, 'utf8');
  if (actual !== expected) drifts.push({ file, reason: 'differs from generator output' });
}

const drifts: Drift[] = [];

const openapi = JSON.stringify(extractOpenApi(), null, 2) + '\n';
compare(OPENAPI_JSON, openapi, drifts);

for (const f of generateSwift()) compare(f.path, f.contents, drifts);

for (const f of fs.readdirSync(RN_LOCALES_DIR).filter((f) => f.endsWith('.json'))) {
  const parsed = JSON.parse(fs.readFileSync(path.join(RN_LOCALES_DIR, f), 'utf8'));
  compare(path.join(SWIFT_CORE_RESOURCES_LOCALES_DIR, f), JSON.stringify(parsed, null, 2) + '\n', drifts);
}

if (drifts.length > 0) {
  console.error('Generated artifacts are out of date:');
  for (const d of drifts) console.error(`  - ${path.relative(REPO_ROOT, d.file)}: ${d.reason}`);
  console.error('\nRun `npm run gen` in native/shared/codegen and commit the result.');
  process.exit(1);
}
console.log('No drift: all generated artifacts match their sources.');
