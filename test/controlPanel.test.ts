// SUP-REQ-003 (SUP-T-03): a control panel generated per chart — Query, Options, Appearance.
import { describe, expect, test } from 'vitest';
import { CHARTS } from '../src/catalog.generated';
import { controlPanelFor } from '../src/shared/controlPanel';

type Control = { name: string; config: { type: string; label: string; multi?: boolean; choices?: [string, string][]; validators?: unknown[]; default?: unknown } };
const controls = (slug: string, section: number) => (controlPanelFor(CHARTS[slug]!).controlPanelSections[section]!.controlSetRows.flat() as (Control | string)[]);
const named = (slug: string, section: number, name: string) => controls(slug, section).find((c) => typeof c !== 'string' && c.name === name) as Control;

describe('control panel', () => {
  test('three sections: Query, Options, Appearance', () => {
    expect(controlPanelFor(CHARTS['line-chart']!).controlPanelSections.map((s) => s?.label)).toEqual(['Query', 'Options', 'Appearance']);
  });

  test('a dimension role is a column control; a measure role is a metric control; required ones validated', () => {
    expect(named('line-chart', 0, 'role_x').config).toMatchObject({ label: 'X', multi: false });
    expect(named('line-chart', 0, 'role_x').config.validators).toHaveLength(1);
    expect(named('line-chart', 0, 'role_value').config.type).toMatch(/Metric/);
    expect(named('line-chart', 0, 'role_secondary').config.validators).toHaveLength(0);
    expect(named('parallel-coordinates-chart', 0, 'role_dimensions').config.multi).toBe(true);
  });

  test('a temporal role gets a time grain; the query has filters, row limit and ordering', () => {
    const names = controls('activity-grid', 0).map((c) => (typeof c === 'string' ? c : c.name));
    expect(names).toEqual(expect.arrayContaining(['role_date', 'time_grain_sqla', 'adhoc_filters', 'row_limit', 'order_desc']));
  });

  test('options from the catalog: enums as selects with their values, booleans as checkboxes', () => {
    expect(named('line-chart', 1, 'curve').config).toMatchObject({ type: 'SelectControl', default: 'monotone', choices: [['monotone', 'Monotone'], ['linear', 'Linear'], ['natural', 'Natural'], ['step', 'Step']] });
    expect(named('line-chart', 1, 'connectNulls').config.type).toBe('CheckboxControl');
  });

  test('appearance: ground, substrate, mode, palette, each with a theme default', () => {
    expect(controls('bar-chart', 2).map((c) => (c as Control).name)).toEqual(['ground', 'substrate', 'mode', 'palette']);
    expect(named('bar-chart', 2, 'ground').config.choices![0]).toEqual(['', 'Theme default']);
  });
});

// SUP-REQ-003, SUP-REQ-011: Explore evaluates every control's `visibility` with the controls the panel
// holds. Superset's shared `order_desc` reads `controls.timeseries_limit_metric`, which this panel does
// not hold: Explore in Superset master failed with "Cannot read properties of undefined (reading
// 'value')". Every chart's panel is evaluated here as Explore does.
import { sharedControls } from '@superset-ui/chart-controls';

describe('control panel in Explore', () => {
  test.each(Object.keys(CHARTS))('SUP-REQ-011 · %s: every visibility evaluates with the panel\'s own controls', (slug) => {
    const rows = controlPanelFor(CHARTS[slug]!).controlPanelSections.flatMap((s) => s!.controlSetRows.flat()) as (Control | string)[];
    const configs = rows.map((c) => (typeof c === 'string' ? { name: c, config: (sharedControls as Record<string, unknown>)[c] as Record<string, unknown> | undefined } : { name: c.name, config: c.config as Record<string, unknown> }));
    const state = Object.fromEntries(configs.map((c) => [c.name, { ...(c.config ?? {}), value: undefined }]));
    for (const { name, config } of configs) {
      const visibility = config?.visibility as ((p: unknown) => unknown) | undefined;
      if (visibility) expect(() => visibility({ controls: state, form_data: {} }), name).not.toThrow();
    }
  });
});
