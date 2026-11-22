// @vitest-environment node
// SUP-DD-01, SUP-REQ-011: docker/register.mjs registers the preset in a Superset checkout's main
// preset — MainPreset.ts on master, MainPreset.js before it — once.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

const MASTER = `import { Preset } from '@superset-ui/core';
export default class MainPreset extends Preset {
  constructor() {
    super({
      name: 'Legacy charts',
      presets: [new DeckGLChartPreset()],
      plugins: [],
    });
  }
}
`;
const dirs: string[] = [];
const checkout = (file: string): string => {
  const dir = mkdtempSync(join(tmpdir(), 'sp-superset-'));
  dirs.push(dir);
  mkdirSync(join(dir, 'src/visualizations/presets'), { recursive: true });
  writeFileSync(join(dir, 'src/visualizations/presets', file), MASTER);
  return dir;
};
const register = (dir: string) => execFileSync('node', ['docker/register.mjs', dir], { encoding: 'utf8' });
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });

describe('docker/register.mjs', () => {
  test.each(['MainPreset.ts', 'MainPreset.js'])('SUP-DD-01 · registers the preset in %s', (file) => {
    const dir = checkout(file);
    register(dir);
    const source = readFileSync(join(dir, 'src/visualizations/presets', file), 'utf8');
    expect(source).toMatch(/^import \{ SilverpointChartPreset \} from 'superset-plugin-chart-silverpoint';/);
    expect(source).toContain('presets: [new SilverpointChartPreset(), new DeckGLChartPreset()]');
  });

  test('SUP-DD-01 · twice is once', () => {
    const dir = checkout('MainPreset.ts');
    register(dir);
    register(dir);
    expect(readFileSync(join(dir, 'src/visualizations/presets/MainPreset.ts'), 'utf8').match(/new SilverpointChartPreset\(\)/g)).toHaveLength(1);
  });
});
