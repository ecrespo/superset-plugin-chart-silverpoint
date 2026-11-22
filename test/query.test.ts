// SUP-REQ-004, SUP-REQ-005, SUP-REQ-007, SUP-REQ-008 (SUP-T-04, SUP-T-05): buildQuery and transformProps.
import { describe, expect, test } from 'vitest';
import { CHARTS } from '../src/catalog.generated';
import { buildQueryFor } from '../src/shared/buildQuery';
import { transformPropsFor } from '../src/shared/transformProps';

const metric = { expressionType: 'SIMPLE', column: { column_name: 'wins' }, aggregate: 'SUM', label: 'SUM(wins)' };
const formData = { datasource: '1__table', viz_type: 'silverpoint_bar_chart', role_x: ['team'], role_value: metric, row_limit: 100, order_desc: true, orientation: 'rows', title: 'Wins', ground: '', palette: 'sepia' };

describe('buildQuery', () => {
  test('SUP-REQ-004 · one query: role columns and metrics, the row limit and ordering', () => {
    const query = buildQueryFor(CHARTS['bar-chart']!)(formData as never).queries[0]!;
    expect(query.columns).toEqual(['team']);
    expect(query.metrics).toEqual([metric]);
    expect(query.row_limit).toBe(100);
    expect(query.orderby).toEqual([[metric, false]]);
  });
});

describe('transformProps', () => {
  const props = (data: object[], extra: object = {}) => transformPropsFor(CHARTS['bar-chart']!)({ width: 600, height: 400, formData: { ...formData, ...extra }, queriesData: [{ data }], theme: undefined } as never);

  test('SUP-REQ-005 · rows bound with specFromTable, metric columns named by their labels', () => {
    const p = props([{ team: 'A', 'SUM(wins)': 12 }, { team: 'B', 'SUM(wins)': 9 }]);
    expect(p.error).toBeUndefined();
    expect(p.spec).toMatchObject({ chart: 'bar-chart', data: [{ team: 'A', 'SUM(wins)': 12 }, { team: 'B', 'SUM(wins)': 9 }], props: { orientation: 'rows', title: 'Wins', xKey: 'team', valueKey: 'SUM(wins)' }, palette: 'sepia', width: 600, height: 400 });
    expect(p.slug).toBe('bar-chart');
  });

  test('SUP-REQ-007 · a failed binding carries the SpecError\'s message', () => {
    expect(props([{ team: 'A' }]).error).toMatch(/no column "SUM\(wins\)"/);
  });

  test('SUP-REQ-008 · a dark theme picks a dark ground by default; the control panel overrides it', () => {
    const dark = transformPropsFor(CHARTS['bar-chart']!)({ width: 600, height: 400, formData, queriesData: [{ data: [{ team: 'A', 'SUM(wins)': 1 }] }], theme: { colorBgContainer: '#141414', colorText: '#ffffff' } } as never);
    const light = props([{ team: 'A', 'SUM(wins)': 1 }]);
    expect(dark.spec!.substrate).not.toBe(light.spec!.substrate);
    const chosen = transformPropsFor(CHARTS['bar-chart']!)({ width: 600, height: 400, formData: { ...formData, ground: 'cyanotype' }, queriesData: [{ data: [{ team: 'A', 'SUM(wins)': 1 }] }], theme: { colorBgContainer: '#141414' } } as never);
    expect(chosen.spec!.ground).toBe('cyanotype');
  });

  describe('H-5 · high contrast', () => {
    const contrast = (query: string | null) => {
      const original = window.matchMedia;
      window.matchMedia = ((q: string) => ({ matches: q === query, media: q }) as MediaQueryList) as typeof window.matchMedia;
      return () => { window.matchMedia = original; };
    };
    const row = [{ team: 'A', 'SUM(wins)': 1 }];

    test.each(['(forced-colors: active)', '(prefers-contrast: more)'])('H-5 · %s switches to precision', (query) => {
      const restore = contrast(query);
      try {
        expect(props(row).spec!.mode).toBe('precision');
        expect(transformPropsFor(CHARTS['bar-chart']!)({ width: 600, height: 400, formData, queriesData: [{ data: row }], theme: { colorBgContainer: '#141414' } } as never).spec!.mode).toBe('precision');
      } finally { restore(); }
    });

    test('H-5 · high contrast wins over the control panel\'s mode', () => {
      const restore = contrast('(forced-colors: active)');
      try { expect(props(row, { mode: 'ink' }).spec!.mode).toBe('precision'); } finally { restore(); }
    });

    test('H-5 · without high contrast the mode is the control panel\'s', () => {
      const restore = contrast(null);
      try {
        expect(props(row).spec!.mode).not.toBe('precision');
        expect(props(row, { mode: 'precision' }).spec!.mode).toBe('precision');
      } finally { restore(); }
    });
  });
});
