// SUP-REQ-003: a chart's control panel from the host catalog — Query (one control per role, filters,
// row limit, ordering), Options (the chart's options) and Appearance (ground, substrate, mode, palette).
import { t } from '@apache-superset/core/translation';
import { validateNonEmpty } from '@superset-ui/core';
import { sharedControls, type ControlPanelConfig } from '@superset-ui/chart-controls';
import { APPEARANCE } from '../catalog.generated.js';
import type { CatalogChart, CatalogOption, CatalogRole } from '../catalog-types.js';

const words = (s: string): string => s.replace(/[-_]+/g, ' ').replace(/(^|\s)\w/g, (c) => c.toUpperCase());
const plain = (doc: string): string => doc.replace(/`/g, '').replace(/\s*\(REQ-\d+(?:, REQ-\d+)*\)/g, '');
/** Superset's t() refuses an empty key. */
const tr = (text: string): string => (text ? t(text) : '');

function roleControl(role: CatalogRole): { name: string; config: Record<string, unknown> } {
  const base = role.kind === 'measure' ? (role.multiple ? sharedControls.metrics : sharedControls.metric) : sharedControls.groupby;
  return {
    name: `role_${role.id}`,
    config: {
      ...base,
      label: t(role.label),
      description: t(`${role.kind === 'measure' ? 'Metric' : 'Column'} for the ${role.label.toLowerCase()} role (${role.dataType})${role.required ? '' : '; optional'}.`),
      multi: role.multiple,
      validators: role.required ? [validateNonEmpty] : [],
      ...(role.required ? {} : { clearable: true }),
    },
  };
}

function optionControl(option: CatalogOption): { name: string; config: Record<string, unknown> } {
  const base = { label: tr(option.label), description: tr(plain(option.doc)), renderTrigger: true };
  if (option.kind === 'enum') return { name: option.name, config: { ...base, type: 'SelectControl', clearable: false, default: option.default ?? option.values?.[0], choices: (option.values ?? []).map((v) => [v, words(v)]) } };
  if (option.kind === 'boolean') return { name: option.name, config: { ...base, type: 'CheckboxControl', default: option.default ?? false } };
  return { name: option.name, config: { ...base, type: 'TextControl', isFloat: option.kind === 'number', default: option.default ?? '' } };
}

/** Superset's sort-order control without its `visibility`, which reads `timeseries_limit_metric` — a
 * control this panel does not hold (Explore failed on it). buildQuery orders by the first metric. */
function orderDesc(): { name: string; config: Record<string, unknown> } {
  const { visibility: _visibility, ...config } = (sharedControls as unknown as Record<string, Record<string, unknown>>).order_desc ?? {};
  return { name: 'order_desc', config: { type: 'CheckboxControl', label: t('Sort descending'), default: true, ...config } };
}

export function controlPanelFor(chart: CatalogChart): ControlPanelConfig {
  const roles = [...chart.roles.filter((r) => r.required), ...chart.roles.filter((r) => !r.required)];
  const temporal = chart.roles.some((r) => r.kind === 'temporal');
  const substrates = [...new Map(APPEARANCE.grounds.flatMap((g) => g.substrates.map((s) => [s.name, s.label] as const))).entries()];
  const pick = (name: string, label: string, items: readonly (readonly [string, string])[]) => ({
    name,
    config: { type: 'SelectControl', label: t(label), renderTrigger: true, clearable: false, default: '', choices: [['', t('Theme default')], ...items] },
  });
  return {
    controlPanelSections: [
      {
        label: t('Query'),
        expanded: true,
        controlSetRows: [...roles.map((r) => [roleControl(r)]), ...(temporal ? [['time_grain_sqla']] : []), ['adhoc_filters'], ['row_limit'], [orderDesc()]],
      },
      { label: t('Options'), expanded: true, controlSetRows: chart.options.map((o) => [optionControl(o)]).concat([[optionControl({ name: 'title', label: 'Title', doc: 'The accessible name, and the card’s title when one is drawn.', kind: 'string' })]]) },
      {
        label: t('Appearance'),
        expanded: false,
        controlSetRows: [
          [pick('ground', 'Ground', APPEARANCE.grounds.map((g) => [g.name, g.label] as const))],
          [pick('substrate', 'Substrate', substrates)],
          [pick('mode', 'Mode', APPEARANCE.modes.map((m) => [m.name, m.label] as const))],
          [pick('palette', 'Palette', APPEARANCE.palettes.map((p) => [p.name, p.label] as const))],
        ],
      },
    ],
  } as unknown as ControlPanelConfig;
}
