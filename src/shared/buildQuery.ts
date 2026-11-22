// SUP-REQ-004, SUP-Art. 1: one query with the role columns and metrics; the row limit, ordering and
// filters are Superset's own controls. Nothing is aggregated or sorted here.
import { buildQueryContext, type QueryFormData } from '@superset-ui/core';
import type { CatalogChart } from '../catalog-types.js';
import { roleFields } from './fields.js';

export function buildQueryFor(chart: CatalogChart) {
  return function buildQuery(formData: QueryFormData) {
    const { columns, metrics } = roleFields(chart, formData as never);
    return buildQueryContext(formData, (base) => [
      {
        ...base,
        columns,
        metrics,
        ...(metrics.length > 0 ? { orderby: [[metrics[0]!, !formData.order_desc]] } : {}),
      },
    ]);
  };
}
