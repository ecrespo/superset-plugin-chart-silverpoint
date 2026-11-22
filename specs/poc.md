# SUP-T-02 — findings

| Question | Finding (2026-11-21) |
|---|---|
| Supported Superset versions (SUP-OQ-1) | `superset-frontend/package.json`: 6.0.0 and 6.1.0 have React `^17.0.2`; master has `^18.3.0`. `@silverpoint/react` 0.10 and 0.11 need React `^18.2 \|\| ^19`, so **only master** (the next release) can host these plugins as specified (SUP-DD-04). Supporting 6.x would mean drawing with the embed client instead of the React components — a change to SUP-DD-04 for the user to decide. |
| Stylesheet import (SUP-REQ-009) | `import '@silverpoint/grounds/styles.css'` and `'@silverpoint/fonts/fonts.css'` from the package entry; plain CSS imports Superset's webpack already handles. Verified in a Vite harness (`e2e/`) and, 2026-11-22, in a Superset master build (`docker/compose.yml`): the chart draws with the stylesheet and EB Garamond in Explore. |
| `@superset-ui/*` on npm | the published 0.20.x packages lag the monorepo (their peer is React 16) and miss some dependencies (`json-bigint`, `antd-v5`); they serve the unit tests only. Inside Superset the plugin uses Superset's own copies (peers). |
| `.supx` registering a chart (SUP-DD-03) | **No** (2026-11-22, Superset master `d5966f4`). Extensions reach the host only through `@apache-superset/core`, built per extension from `window.superset`, whose namespaces are `authentication, chat, commands, common, components, contributions, core, editors, extensions, menus, navigation, sqlLab, storage, theme, translation, utils, views` — none for charts; the documented contribution types are views, commands, menus, editors and chat; and `@superset-ui/core`, which holds the chart registries, is not a Module Federation shared module, so an extension registering a `ChartPlugin` would fill its own copy. Recorded, not specified as a delta; `test/superset/explore.spec.ts` (*SUP-DD-03*) fails the day a chart namespace appears, which is the revisit. |

## Live run (2026-11-22, silverpoint 0.11.1, Superset master)

`docker/compose.yml` (Superset master's frontend with the preset, backend `apache/superset:master`,
examples loaded) and `npm run e2e:superset`: 2 passed — the gallery lists the *Silverpoint* types;
chart 104 (`silverpoint_bar_chart`, `birth_names`, X `name`, Value `SUM(num)`, 10 rows) is created
through the API, drawn in Explore at 787×622 and read by keyboard ("name Michael, SUM(num) 2,467,129"
→ "name Christopher, SUM(num) 1,725,328"). What the live build found, each now fixed with a test:

| Found | Fix |
|---|---|
| Superset master's main preset is `MainPreset.ts` | `docker/register.mjs` takes `.ts` or `.js` |
| webpack resolves an ES module package's relative imports as fully specified | `.js` on every relative import in `src/` and the generator's templates |
| master moved `t` to `@apache-superset/core/translation` (`export 't' was not found in '@superset-ui/core'`) | `t` from there; `@apache-superset/core` a peer, as Superset's own plugins |
| the shared `order_desc` control's `visibility` reads `timeseries_limit_metric` (Explore: "Cannot read properties of undefined (reading 'value')") | the panel's own copy of `order_desc` without it; every visibility of every panel is evaluated in a test |
| master needs Node 24 and the `zstd` binary to build | the Dockerfile and CI follow Superset's own Dockerfile |
| `.npmrc` `min-release-age=3`: a silverpoint release younger than three days does not install (`ETARGET`) | documented; `NPM_MIN_RELEASE_AGE=0` build argument, set by the test compose only |

