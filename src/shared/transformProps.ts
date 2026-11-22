// SUP-REQ-005, SUP-REQ-007, SUP-REQ-008, SUP-Art. 1, H-5: the query's rows bound to the chart's roles
// with specFromTable, sized to the chart's box, with the theme's appearance under the control panel's,
// and `precision` whenever the browser reports high contrast.
import { specErrorMessage } from '@silverpoint/embed';
import { hostAppearance } from '@silverpoint/embed/client';
import { specFromTable } from '@silverpoint/embed/hosts';
import type { CatalogChart } from '../catalog-types.js';
import { roleFields, type FormData } from './fields.js';

export interface ChartProps {
  readonly width: number;
  readonly height: number;
  readonly formData: FormData;
  readonly rawFormData?: FormData;
  readonly queriesData: readonly { readonly data?: readonly Record<string, unknown>[] }[];
  readonly theme?: Readonly<Record<string, unknown>>;
}
export interface SilverpointChartProps {
  readonly slug: string;
  readonly width: number;
  readonly height: number;
  readonly spec?: Record<string, unknown> & { chart: string };
  readonly error?: string;
}

/** The theme's background and text colours: Superset 6's tokens, or the older palette. */
function themeColours(theme: ChartProps['theme']): { background?: string; foreground?: string } {
  if (!theme) return {};
  const colors = theme.colors as { grayscale?: { light5?: string; dark2?: string } } | undefined;
  const pick = (v: unknown) => (typeof v === 'string' ? v : undefined);
  return {
    background: pick(theme.colorBgContainer) ?? pick(theme.colorBgBase) ?? colors?.grayscale?.light5,
    foreground: pick(theme.colorText) ?? pick(theme.colorTextBase) ?? colors?.grayscale?.dark2,
  };
}

/** H-5: the host reports high contrast through the browser (Windows contrast themes, macOS "Increase
 * contrast"); Superset's theme carries no such flag. */
function highContrast(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(forced-colors: active)').matches || window.matchMedia('(prefers-contrast: more)').matches;
}

export function transformPropsFor(chart: CatalogChart) {
  return function transformProps(chartProps: ChartProps): SilverpointChartProps {
    const formData = chartProps.rawFormData ?? chartProps.formData;
    const { roles } = roleFields(chart, formData);
    const options: Record<string, unknown> = { chrome: 'bare' };
    for (const option of [...chart.options, { name: 'title', kind: 'string' }]) {
      const v = formData[option.name];
      if (v === undefined || v === null || v === '') continue;
      options[option.name] = option.kind === 'number' ? Number(v) : v;
    }
    const colours = themeColours(chartProps.theme);
    const contrast = highContrast();
    const appearance: Record<string, string> = {};
    if (colours.background) {
      const host = hostAppearance({ background: colours.background, ...(colours.foreground ? { foreground: colours.foreground } : {}), highContrast: contrast });
      Object.assign(appearance, { ground: host.ground, substrate: host.substrate });
    }
    for (const key of ['ground', 'substrate', 'mode', 'palette']) {
      const v = formData[key];
      if (typeof v === 'string' && v !== '') appearance[key] = v;
    }
    // H-5: high contrast is not a preference the control panel can turn off.
    if (contrast) appearance.mode = 'precision';
    const size = { width: Math.max(1, Math.floor(chartProps.width)), height: Math.max(1, Math.floor(chartProps.height)) };
    const result = specFromTable({ chart: chart.slug, table: { rows: [...(chartProps.queriesData[0]?.data ?? [])] }, roles, options, appearance, size, id: `superset-${chart.slug}` } as never);
    if (!result.ok) return { slug: chart.slug, ...size, error: `${chart.title}: ${specErrorMessage(result.error)}` };
    return { slug: chart.slug, ...size, spec: result.value as SilverpointChartProps['spec'] };
  };
}
