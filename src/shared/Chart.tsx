// SUP-DD-04, SUP-REQ-005..007: the chart drawn by its @silverpoint/react component, loaded lazily by
// slug; a binding error is thrown for Superset's chart error boundary.
import React, { lazy, Suspense, type ComponentType } from 'react';
import { COMPONENTS } from '../components.generated.js';
import type { SilverpointChartProps } from './transformProps.js';

const loaded = new Map<string, ComponentType<Record<string, unknown>>>();
function componentOf(slug: string): ComponentType<Record<string, unknown>> {
  let component = loaded.get(slug);
  if (!component) {
    const load = COMPONENTS[slug];
    if (!load) throw new Error(`silverpoint has no chart "${slug}".`);
    component = lazy(() => load().then((c) => ({ default: c })));
    loaded.set(slug, component);
  }
  return component;
}

/** A ChartSpec as the component's props (the same mapping as the embed's renderer). */
export function specProps(spec: Record<string, unknown>): Record<string, unknown> {
  const { chart: _chart, data, props, ...look } = spec as { chart: string; data?: unknown; props?: Record<string, unknown> } & Record<string, unknown>;
  return { ...(props ?? {}), ...(data === undefined ? {} : { data }), ...look };
}

export default function SilverpointChart(props: SilverpointChartProps): React.ReactElement {
  if (props.error !== undefined || !props.spec) throw new Error(props.error ?? 'silverpoint: nothing to draw.');
  const Component = componentOf(props.slug);
  return (
    <div className="superset-plugin-chart-silverpoint" style={{ width: props.width, height: props.height }}>
      <Suspense fallback={null}>
        <Component {...specProps(props.spec)} />
      </Suspense>
    </div>
  );
}
