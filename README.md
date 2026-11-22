# superset-plugin-chart-silverpoint

Apache Superset chart plugins that draw [silverpoint](https://github.com/ecrespo/silverpoint) charts:
56 viz types, one per chart a table can feed — *Silverpoint Bar chart*, *Silverpoint Sankey chart*, … in the chart gallery — each with a
control panel generated from silverpoint's host catalog. Superset queries; silverpoint draws.

Draws with **silverpoint 0.11** (`@silverpoint/react` 0.11.1, and the binding from `@silverpoint/embed`
0.11.1's `/hosts` entry): one version of one line, every `@silverpoint` package at exactly `0.11.1`,
checked by `npm run check` (H-2).

## Supported Superset

**Superset master** (React 18.3), which becomes the next release after 6.1. Superset 6.0 and 6.1 ship
React 17, and `@silverpoint/react` needs React 18.2 or later, so they are not supported.

Peer dependencies: `@superset-ui/core`, `@superset-ui/chart-controls` (any: Superset's own),
`react` and `react-dom` `^18.3.0`.

## Install (classic plugin)

```sh
cd superset-frontend
npm install superset-plugin-chart-silverpoint
```

In `src/visualizations/presets/MainPreset.ts` (`MainPreset.js` before Superset master):

```js
import { SilverpointChartPreset } from 'superset-plugin-chart-silverpoint';

// presets: [new SilverpointChartPreset(), …]
// or a subset: new SilverpointChartPreset({ charts: ['bar-chart', 'line-chart', 'sankey-chart'] })
```

then rebuild the frontend (`npm run build`). Superset master's `.npmrc` sets `min-release-age=3`: for
three days after a silverpoint release npm answers `ETARGET` for its `@silverpoint/*` packages; wait,
or install with `--min-release-age=0` (`docker/Dockerfile`: `--build-arg NPM_MIN_RELEASE_AGE=0`). The package imports the library's stylesheet and EB
Garamond itself, and each chart has a light and a dark thumbnail. Superset's webpack configuration needs no change (its relative imports are fully
specified, as webpack requires of an ES module package). `docker/Dockerfile` builds a Superset image
with the plugins registered (Node 24, the backend of the same ref); `docker/compose.yml` runs it with
the examples loaded, which `npm run e2e:superset` tests.

## Each chart

- **Query**: one control per role — dimension roles take a column, measure roles a metric, a temporal
  role adds a time grain — plus filters, the row limit and the sort order. Superset aggregates, filters
  and sorts; the plugin binds the result.
- **Options**: the chart's own options (curve, orientation, …) and the title.
- **Appearance**: ground, substrate, mode, palette; *Theme default* follows Superset's light or dark theme.

A missing column or metric shows Superset's chart error with the reason. Charts read by keyboard and
fill the size Superset gives them. When the browser reports high contrast (forced colours, or
*increase contrast*), every chart is drawn in `precision` mode, whatever the control panel says.

## Development

```sh
npm install --legacy-peer-deps
npm run generate     # src/plugins/<slug>/…, thumbnails (Chromium), the catalog and component map
npm run check        # generated files current; one engine version; standalone files match integrity.json
npm run kit          # also: the GitHub release's hosts kit matches the npm package (network)
npm run typecheck:superset   # src/ against Superset master's own packages (sparse clone, ~15 s)
npm test && npm run build && npm run conformance && npm run e2e
```

**Following a new silverpoint line** (H-2): set every `@silverpoint/*` dependency and
`silverpoint.engine` / `silverpoint.line` in `package.json` to the new version, `npm install`,
`npm run generate`, `npm run check && npm run kit`, `npm run conformance && npm run e2e`, then release.

Licence: MIT.

## Not (yet) a `.supx`

Superset's Extensions framework cannot contribute a chart type (checked on master, 2026-11-22: an
extension sees `@apache-superset/core` only, which has no chart registry), so the classic plugin is
the only path. Cross-filters are not emitted yet, and the charts do not offer them on dashboards.
