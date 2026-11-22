// Registers the preset in a Superset checkout's main preset (SUP-DD-01: the classic plugin path):
// src/visualizations/presets/MainPreset.ts on master, MainPreset.js in 6.x and before. Idempotent.
// Usage: node register.mjs <superset-frontend dir>
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.argv[2] ?? '.', 'src/visualizations/presets');
const file = ['MainPreset.ts', 'MainPreset.js'].map((name) => join(dir, name)).find((path) => existsSync(path));
if (!file) throw new Error(`no MainPreset.ts or MainPreset.js in ${dir}`);
let source = readFileSync(file, 'utf8');
if (!source.includes('superset-plugin-chart-silverpoint')) {
  source = `import { SilverpointChartPreset } from 'superset-plugin-chart-silverpoint';\n${source}`;
  source = source.replace(/presets:\s*\[/, 'presets: [new SilverpointChartPreset(), ');
  if (!source.includes('new SilverpointChartPreset()')) throw new Error(`no "presets: [" in ${file}`);
  writeFileSync(file, source);
}
console.log(`registered SilverpointChartPreset in ${file}`);
