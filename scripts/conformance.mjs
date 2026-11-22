// SUP-REQ-012, H-4: the conformance kit through the module entries the plugin resolves at run time
// (@silverpoint/embed, which lib/shared/transformProps.js imports), in Node. The same kit runs in
// Chromium in test/e2e/conformance.spec.ts, the runtime the plugin ships in.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { conformance } from '@silverpoint/embed/conformance';
import { renderToSVG, VERSION } from '@silverpoint/embed';

const cases = JSON.parse(readFileSync(fileURLToPath(import.meta.resolve('@silverpoint/embed/conformance.json')), 'utf8'));
const result = await conformance((spec) => {
  const out = renderToSVG(spec);
  if (!out.ok) throw new Error(JSON.stringify(out.error));
  return out.value.svg;
}, undefined, cases);
console.log(`conformance ${cases.version} (@silverpoint/embed ${VERSION}, Node ${process.version}): ${result.passed} passed, ${result.failed.length} failed`);
for (const f of result.failed) console.log(`  ${f.name}: expected ${f.expected}, got ${f.actual}`);
process.exit(result.failed.length === 0 && VERSION === cases.version ? 0 : 1);
