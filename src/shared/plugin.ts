// SUP-REQ-001: one ChartPlugin per chart — metadata from the catalog, the generated control panel and
// query, the shared transformProps, and the component loaded when the chart is first drawn.
import { t } from '@apache-superset/core/translation';
import { ChartMetadata, ChartPlugin, type QueryFormData } from '@superset-ui/core';
import type { ControlPanelConfig } from '@superset-ui/chart-controls';
import type { CatalogChart } from '../catalog-types.js';
import { transformPropsFor } from './transformProps.js';

const words = (s: string): string => s.replace(/[-_]+/g, ' ').replace(/(^|\s)\w/g, (c) => c.toUpperCase());

export type SilverpointPlugin = new () => ChartPlugin;

export function makePlugin(chart: CatalogChart, parts: { buildQuery: (formData: QueryFormData) => unknown; controlPanel: ControlPanelConfig; thumbnail: string; thumbnailDark: string }): SilverpointPlugin {
  const metadata = new ChartMetadata({
    // SUP-REQ-001: "Silverpoint Bar chart", told apart from Superset's own "Bar Chart".
    name: `${t('Silverpoint')} ${t(chart.title)}`,
    description: t(chart.summary),
    category: t('Silverpoint'),
    tags: [t('Silverpoint'), t(words(chart.family)), ...chart.roles.filter((r) => r.kind === 'temporal').map(() => t('Temporal'))],
    thumbnail: parts.thumbnail,
    // SUP-REQ-010: no InteractiveChart — a dashboard would offer cross-filters these charts do not emit.
    behaviors: [],
  });
  // SUP-REQ-008: the dark theme's thumbnail. Superset master's ChartMetadata takes `thumbnailDark`;
  // the published @superset-ui/core 0.20 predates it (neither typed nor kept), so it is set on the
  // instance, which is what master's constructor does.
  Object.assign(metadata, { thumbnailDark: parts.thumbnailDark });
  return class extends ChartPlugin {
    constructor() {
      super({
        metadata,
        buildQuery: parts.buildQuery as never,
        controlPanel: parts.controlPanel,
        transformProps: transformPropsFor(chart) as never,
        loadChart: () => import('./Chart.js'),
      });
    }
  };
}
