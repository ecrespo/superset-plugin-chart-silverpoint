// SUP-REQ-001, SUP-REQ-002, SUP-REQ-003, H-3 (SUP-T-03, SUP-T-06): generated plugins and the preset.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { PLUGINS, pluginKey, SilverpointChartPreset } from '../src';

const catalog = JSON.parse(readFileSync('node_modules/@silverpoint/embed/dist/host-catalog.json', 'utf8'));
const bindable = catalog.charts.filter((c: { binding: string }) => c.binding !== 'none');

describe('plugins', () => {
  test('SUP-REQ-001 · one plugin per bindable chart, keyed silverpoint_<slug>, with generated files', () => {
    expect(Object.keys(PLUGINS).sort()).toEqual(bindable.map((c: { slug: string }) => c.slug).sort());
    expect(pluginKey('bar-chart')).toBe('silverpoint_bar_chart');
    for (const chart of bindable) {
      for (const file of ['index.ts', 'controlPanel.ts', 'buildQuery.ts']) expect(existsSync(`src/plugins/${chart.slug}/${file}`), `${chart.slug}/${file}`).toBe(true);
      const png = readFileSync(`src/plugins/${chart.slug}/images/thumbnail.png`);
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect(readFileSync(`src/plugins/${chart.slug}/images/thumbnail-dark.png`).subarray(1, 4).toString(), `${chart.slug} dark`).toBe('PNG');
    }
    expect(readdirSync('src/plugins').length).toBe(bindable.length);
  });

  test('SUP-REQ-001 · metadata: name, description, category Silverpoint, tags from the catalog', () => {
    const plugin = new PLUGINS['line-chart']!();
    expect(plugin.metadata.name).toBe('Silverpoint Line chart');
    expect(new PLUGINS['bar-chart']!().metadata.name).toBe('Silverpoint Bar chart');
    expect(plugin.metadata.description).toBe(catalog.charts.find((c: { slug: string }) => c.slug === 'line-chart').summary);
    expect(plugin.metadata.category).toBe('Silverpoint');
    expect(plugin.metadata.tags).toEqual(expect.arrayContaining(['Silverpoint', 'Lines']));
    expect(plugin.metadata.thumbnail).toBeTruthy();
    // SUP-REQ-008: a thumbnail for Superset's dark theme too, drawn from the same demo.
    expect((plugin.metadata as unknown as { thumbnailDark?: string }).thumbnailDark).toBeTruthy();
    expect((plugin.metadata as unknown as { thumbnailDark?: string }).thumbnailDark).not.toBe(plugin.metadata.thumbnail);
  });

  // SUP-REQ-010: Superset's dashboards take a chart declaring InteractiveChart as a cross-filter source
  // (src/dashboard/util/crossFilters.ts); no chart emits one before SUP-REQ-010, so none declares it.
  test('SUP-REQ-010 · no plugin claims cross-filters before they are emitted', () => {
    for (const Plugin of Object.values(PLUGINS)) expect(new Plugin().metadata.behaviors).not.toContain('INTERACTIVE_CHART');
  });

  test('SUP-REQ-002 · the preset registers every plugin, or the subset an installer names', () => {
    const all = new SilverpointChartPreset();
    expect(all.plugins.map((p) => (p as unknown as { config: { key: string } }).config.key).sort()).toEqual(bindable.map((c: { slug: string }) => pluginKey(c.slug)).sort());
    const some = new SilverpointChartPreset({ charts: ['bar-chart', 'line-chart'] });
    expect(some.plugins.map((p) => (p as unknown as { config: { key: string } }).config.key)).toEqual(['silverpoint_bar_chart', 'silverpoint_line_chart']);
    expect(() => new SilverpointChartPreset({ charts: ['bar-chrt'] })).toThrow(/bar-chrt.*bar-chart/);
  });

  test('H-3 · the generated files are current', () => {
    expect(() => execFileSync('node', ['scripts/make-plugins.ts', '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});

// SUP-REQ-011, SUP-DD-01: Superset's webpack resolves a `"type": "module"` package's relative imports
// as fully specified (it relaxes that only for geostyler). tsc keeps specifiers as written, so every
// relative import in src/ names its file: `./fields.js`, not `./fields`.
describe('the package as Superset\'s webpack resolves it', () => {
  test('SUP-REQ-011 · every relative import is fully specified', () => {
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts') ? [`${dir}/${e.name}`] : []));
    const bare = walk('src').flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g)]
      .map((m) => m[1]!)
      .filter((spec) => !/\.(js|png|css|json)$/.test(spec))
      .map((spec) => `${file}: ${spec}`));
    expect(bare).toEqual([]);
  });
});

// SUP-REQ-011, SUP-Art. 2: Superset master moved the translator out of @superset-ui/core; its own
// plugins import `t` from @apache-superset/core/translation (a peer, as theirs). Found by building
// Superset master with the preset: "export 't' was not found in '@superset-ui/core'".
describe('Superset master\'s packages', () => {
  test('SUP-REQ-011 · `t` comes from @apache-superset/core/translation, never @superset-ui/core', () => {
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []));
    const offenders = walk('src').filter((file) => /import\s*\{[^}]*\bt\b[^}]*\}\s*from\s*'@superset-ui\/core'/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.peerDependencies['@apache-superset/core']).toBeDefined();
  });
});
