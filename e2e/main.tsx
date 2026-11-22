// SUP-T-07: the built package (lib/) registered through Superset's own SuperChart, the way a Superset
// frontend draws a chart — the plugin's buildQuery is skipped, the rows are given as query data.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SuperChart, ThemeProvider, supersetTheme } from '@superset-ui/core';
import './setup';
import { SilverpointChartPreset } from '../lib/index.js';

new SilverpointChartPreset({ charts: ['bar-chart', 'line-chart'] }).register();
const metric = { expressionType: 'SIMPLE', column: { column_name: 'num' }, aggregate: 'SUM', label: 'SUM(num)' };
const rows = [{ name: 'Ann', 'SUM(num)': 12 }, { name: 'Bob', 'SUM(num)': 9 }, { name: 'Cy', 'SUM(num)': 15 }];
const params = new URLSearchParams(location.search);
const formData = { datasource: '1__table', viz_type: 'silverpoint_bar_chart', role_x: ['name'], role_value: params.get('metric') === 'missing' ? { ...metric, label: 'SUM(other)' } : metric, title: 'Births by name', row_limit: 100 };

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={supersetTheme}>
    <SuperChart chartType="silverpoint_bar_chart" width={Number(params.get('width') ?? 600)} height={320} formData={formData} queriesData={[{ data: rows }]} />
  </ThemeProvider>,
);
