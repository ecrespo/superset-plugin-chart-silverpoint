# `superset-plugin-chart-silverpoint` — Tasks

> Split from `specs/spec-pack.md` (silverpoint feature-007, `repositories/`), content unchanged.

## Tasks

- [x] **SUP-T-01** Split this pack into `specs/`; `CLAUDE.md`; scaffold with Superset's generator. Stop for review. *H-7*
- [x] **SUP-T-02** PoC, on `@silverpoint/react` 0.10 and by hand: one plugin (`bar-chart`) in a local Superset; record the supported Superset versions, the stylesheet import that works (SUP-REQ-009), and whether a `.supx` can register a chart. Write `specs/poc.md`. *SUP-DD-01, SUP-DD-03*
- [x] **SUP-T-03** `scripts/make-plugins.ts` and `--check`. *SUP-REQ-001, SUP-REQ-003, H-3*
- [x] **SUP-T-04** `buildQuery`, `transformProps`, the lazy component map. *SUP-REQ-004, SUP-REQ-005, SUP-REQ-007*
- [x] **SUP-T-05** Sizing, theme. *SUP-REQ-006, SUP-REQ-008*
- [x] **SUP-T-06** The preset and subsets; thumbnails generated from demos. *SUP-REQ-001, SUP-REQ-002*
- [x] **SUP-T-07** The integration job and the kit. *SUP-REQ-011, SUP-REQ-012, H-4, H-5*
- [ ] **SUP-T-08** README: installing into a Superset image (a Dockerfile); release `0.1.0` with provenance.

Deferred to a later release, with no task yet: SUP-REQ-010 (cross-filters).

## Open questions

- **SUP-OQ-1** Supported Superset versions (5.x? 6.x only?) — SUP-T-02.
- **SUP-OQ-2** Sixty viz types in the gallery: all, or a curated default set with the rest opt-in?

## Bootstrap prompt

````text
This repository will publish `superset-plugin-chart-silverpoint`: Apache Superset viz plugins drawing silverpoint charts with @silverpoint/react. Its design is in specs/spec-pack.md, written in the silverpoint repository (~/WebstormProjects/silverpoint/changes/feature-007-bi-hosts). Read the pack, that folder's README.md and repositories/README.md §3, and Superset's "Creating visualization plugins" page.

Do SUP-T-01 only: split the pack into specs/ without changing its content, write CLAUDE.md, scaffold the plugin with Superset's generator and make its build and tests pass untouched. Show me the tree and the build's output, then stop. SUP-T-02 is a PoC I want to review before anything is generated.
````

## Implementation ledger (2026-11-21)

Built test-first against silverpoint `0.10.1` (`@silverpoint/react` from npm; the embed's module
entries vendored). Local run: `npm run check` (56 plugins current, vendor ok), `npm run typecheck`,
`npm test` (16 tests: generated plugins and preset, control panels, `buildQuery`, `transformProps`,
the component in happy-dom), `npm run build`, `npm run conformance` (76/0 through `vendor/embed/`),
`npm run e2e` (4 tests: the built package inside Superset's `SuperChart`, in Chromium).

### Deviations — to review

- **SUP-D1 — the embed is vendored** (`vendor/embed/`, its module entries unmodified, digests in
  `VENDORED.json`): `@silverpoint/embed` is not on npm yet. `scripts/vendor.mjs X.Y.Z` takes it from
  npm once it is, and it can then become a dependency.
- **SUP-D2 — Superset master only** (`specs/poc.md`): released 6.x ships React 17.
- **SUP-D3 — thumbnails are drawn in Chromium** from the demos (CSS custom properties need a browser);
  `--check` compares the demos' SVG digests (`src/thumbnails.lock.json`) and that each PNG exists.
- **SUP-D4 — the chart is drawn `bare`**: Superset's chart has its own title and frame, and `bare` is
  what fills the box exactly.

### Open

- SUP-T-02's live half (a local Superset; `.supx`), SUP-T-07's integration job (written in `ci.yml`,
  job `superset`: it builds Superset master's frontend with the preset; not run here), and SUP-T-08's
  release. SUP-OQ-2 (all 56 or a curated set): all are registered by default; `charts` selects a subset.


## Implementation ledger (2026-11-22) — silverpoint 0.11

Followed the new line (H-2: bump → regenerate → kit → release), against silverpoint `0.11.1`
(`@silverpoint/react` 0.11.1, `@silverpoint/embed` 0.11.1 from npm; reflex-silverpoint-react 0.11.0
is on the same line). Local run: `npm run check` (56 plugins current; engine ok: 5 `@silverpoint`
packages at 0.11.1, 4 standalone files match `integrity.json`), `npm run kit` (the GitHub release's
hosts kit matches the npm package), `npm run typecheck`, `npm test` (31 tests), `npm run build`,
`npm run conformance` (76/0 in Node), `npm run e2e` (7 tests, among them the kit in Chromium, 76/0).

- **SUP-D1 retired.** `@silverpoint/embed` is a dependency; `vendor/` and `scripts/vendor.mjs` are gone.
  `scripts/engine.ts --check` verifies H-2 (every `@silverpoint` dependency and lockfile entry at the
  engine version, the line is its `major.minor`, catalog and kit cases of that version, the standalone
  files against `integrity.json`, the README states the line); `--kit` compares the release's hosts kit.
- **Upstream *As built* note (T-328)**, already met: the 56 bindable charts; thumbnails pass
  `demo.options` to `specFromTable` (regenerated: all 56 thumbnails redrawn for 0.11.1).
- **H-5, fixed:** `transformProps` passed `highContrast: false` always; it now reads the browser's
  `forced-colors: active` / `prefers-contrast: more` and draws `precision`, over the control panel.
- **H-4 in the shipped runtime:** the kit runs in Chromium through the module entries, bundled
  (`test/e2e/conformance.spec.ts`), besides Node.
- **SUP-REQ-011, two defects found before any Superset build ran:** (1) Superset's webpack resolves an
  ES module package's relative imports as fully specified, and `lib/` imported `./fields` — every
  relative import in `src/` (and the generator's templates) now names its `.js` file, with a test;
  (2) Superset master's main preset is `MainPreset.ts`, which `docker/register.mjs` did not find — it
  now takes `.ts` or `.js`, with a test. Superset master needs Node 24: the Dockerfile and CI follow,
  and the image's backend is `apache/superset:<same ref>` (was `latest`, a 6.x backend).
- **SUP-REQ-011's browser test** is `test/superset/explore.spec.ts` (`npm run e2e:superset`) against
  `docker/compose.yml` (the image, the examples, an admin): it creates a `silverpoint_bar_chart` from
  `birth_names` through the API, opens it in Explore and reads it by keyboard. CI job `superset` runs it.
- The pack (`specs/spec-pack.md`) is kept read-only as written; upstream's copy adds only the
  *As built* note above.
- **Live (SUP-T-02's live half, SUP-T-07):** Superset master with the preset, `npm run e2e:superset`
  2/2 — see `specs/poc.md` § Live run for the run and the four plugin defects and two build issues it
  found, each fixed with a test (`npm test`: 88). Still open: `.supx` (SUP-DD-03), SUP-T-08's release.
- **SUP-REQ-001 amended (2026-11-22, user decision):** a plugin is named *Silverpoint* + the catalog's
  title (*Silverpoint Bar chart*): in Explore's chart switcher a bare "Bar chart" stood beside
  Superset's own "Bar Chart". Pack and `prd.md` changed together; silverpoint's copy of the pack not yet.
- **2026-11-22, user decision (items 1–4):**
  - *SUP-REQ-010:* no plugin declares `Behavior.InteractiveChart` — Superset's dashboards take such a
    chart as a cross-filter source (`src/dashboard/util/crossFilters.ts`) and none emits one yet. It
    returns with SUP-REQ-010.
  - *SUP-REQ-008:* a dark thumbnail per chart, `images/thumbnail-dark.png`, drawn from the demo with
    the appearance `hostAppearance` picks for Superset's dark theme, as `ChartMetadata.thumbnailDark`
    (master; set on the instance, the npm 0.20 class predates it). Generated (H-3), locked as `<slug>:dark`.
  - *SUP-DD-03 answered: no* — `specs/poc.md`; a live test is the revisit.
  - *SUP-REQ-011:* `npm run typecheck:superset` (CI, ~15 s) type-checks `src/` against Superset master's
    `@superset-ui/core`, `@superset-ui/chart-controls` and `@apache-superset/core` source (sparse clone,
    no `npm ci`). Shown on the defect that broke the build: the npm typecheck finds 0 errors, this one
    `TS2305: Module '"@superset-ui/core"' has no exported member 't'`.
