# `superset-plugin-chart-silverpoint` — Prd

> Split from `specs/spec-pack.md` (silverpoint feature-007, `repositories/`), content unchanged.

## Scope

**In:** one `ChartPlugin` per tabular chart, a preset that registers them, generated control panels.
**Out:** dashboard cross-filters and drill-by in the first release (SUP-REQ-010 reserves them);
contributing upstream (the project prefers ECharts-based plugins).

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| SUP-REQ-001 | THE PACKAGE SHALL export one `ChartPlugin` class per chart of the pinned host catalog whose `binding` is not `none`, keyed `silverpoint_<slug>`, named *Silverpoint* followed by the catalog's title (*Silverpoint Bar chart*) so the gallery and Explore's chart switcher tell it apart from Superset's own types, with description, category *Silverpoint* and tags from the catalog, and a thumbnail rendered from the chart's demo. | MUST |
| SUP-REQ-002 | THE PACKAGE SHALL export `SilverpointChartPreset`, which registers them all, and SHALL let an installer register a subset by slug. | MUST |
| SUP-REQ-003 | EACH PLUGIN'S control panel SHALL be generated from the host catalog: a *Query* section with one control per role (dimension roles as column controls, measure roles as metric controls, temporal roles with a time grain), an *Options* section from the chart's options, and an *Appearance* section (ground, substrate, mode, palette). | MUST |
| SUP-REQ-004 | `buildQuery` SHALL request the role columns and metrics as one query, with Superset's row limit and ordering controls. | MUST |
| SUP-REQ-005 | `transformProps` SHALL bind the query's rows to the chart's roles with `specFromTable`, naming metric columns by their labels, and SHALL pass the resulting props to the chart's `@silverpoint/react` component, loaded lazily by slug. | MUST |
| SUP-REQ-006 | THE CHART SHALL fill the width and height Superset gives it and redraw when they change. | MUST |
| SUP-REQ-007 | IF binding fails, THEN THE PLUGIN SHALL show Superset's standard chart error with the `SpecError`'s message. | MUST |
| SUP-REQ-008 | WHILE Superset's theme is dark or light, THE PLUGIN SHALL use `hostAppearance`'s result as the default appearance, overridden by the control panel. | SHOULD |
| SUP-REQ-009 | THE PACKAGE SHALL import the library's stylesheet and fonts once, from its own entry, without requiring a change to Superset's webpack configuration. | MUST |
| SUP-REQ-010 | WHERE the dashboard supports cross-filters, a later release SHOULD emit one on `onSelect` for charts with a single dimension role. | SHOULD |
| SUP-REQ-011 | CI SHALL build a Superset frontend of each supported version with the preset registered and run a browser test that creates a chart from the examples dataset and reads it by keyboard. | MUST |
| SUP-REQ-012 | CI SHALL run the conformance kit through the module entry the plugin resolves. | MUST |
