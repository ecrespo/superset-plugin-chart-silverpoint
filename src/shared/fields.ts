// The role controls' values as column names and metric labels (SUP-REQ-005: metric columns are
// named by their labels in the query's rows).
import { getColumnLabel, getMetricLabel, type QueryFormColumn, type QueryFormMetric } from '@superset-ui/core';
import type { CatalogChart } from '../catalog-types.js';

export type FormData = Readonly<Record<string, unknown>>;
const list = <T,>(value: unknown): T[] => (value === undefined || value === null || value === '' ? [] : Array.isArray(value) ? (value as T[]) : [value as T]);

export interface RoleFields { readonly columns: QueryFormColumn[]; readonly metrics: QueryFormMetric[]; readonly roles: Record<string, string | string[]> }

export function roleFields(chart: CatalogChart, formData: FormData): RoleFields {
  const columns: QueryFormColumn[] = [];
  const metrics: QueryFormMetric[] = [];
  const roles: Record<string, string | string[]> = {};
  for (const role of chart.roles) {
    const raw = formData[`role_${role.id}`];
    if (role.kind === 'measure') {
      const chosen = list<QueryFormMetric>(raw);
      metrics.push(...chosen);
      const labels = chosen.map((m) => getMetricLabel(m));
      if (labels.length) roles[role.id] = role.multiple ? labels : labels[0]!;
    } else {
      const chosen = list<QueryFormColumn>(raw);
      columns.push(...chosen);
      const labels = chosen.map((c) => getColumnLabel(c));
      if (labels.length) roles[role.id] = role.multiple ? labels : labels[0]!;
    }
  }
  return { columns, metrics, roles };
}
