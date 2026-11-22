// superset-plugin-chart-silverpoint: one ChartPlugin per silverpoint chart, and a preset (SUP-REQ-001,
// SUP-REQ-002). Register in Superset's MainPreset.js: `new SilverpointChartPreset()`, or a subset with
// `new SilverpointChartPreset({ charts: ['bar-chart', 'line-chart'] })`.
import './styles.js';
import { Preset } from '@superset-ui/core';
import { PLUGINS } from './plugins.generated.js';

export { PLUGINS };
export { ENGINE_VERSION } from './catalog.generated.js';
export type ChartSlug = keyof typeof PLUGINS;

/** The viz type key of a chart: `silverpoint_<slug>` with underscores. */
export const pluginKey = (slug: string): string => `silverpoint_${slug.replace(/-/g, '_')}`;

const distance = (a: string, b: string): number => {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length]!;
};

export class SilverpointChartPreset extends Preset {
  constructor(options: { readonly charts?: readonly string[] } = {}) {
    const slugs = options.charts ?? Object.keys(PLUGINS);
    const unknown = slugs.filter((s) => !(s in PLUGINS));
    if (unknown.length > 0) {
      const near = (s: string) => Object.keys(PLUGINS).filter((k) => distance(s, k) <= 2);
      throw new Error(`silverpoint has no chart ${unknown.map((s) => `"${s}"${near(s).length ? ` (did you mean "${near(s).join('" or "')}"?)` : ''}`).join(', ')}.`);
    }
    super({ name: 'silverpoint', plugins: slugs.map((slug) => new PLUGINS[slug as ChartSlug]().configure({ key: pluginKey(slug) })) });
  }
}
