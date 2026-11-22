# `superset-plugin-chart-silverpoint` — Technical design

> Split from `specs/spec-pack.md` (silverpoint feature-007, `repositories/`), content unchanged.

## Design decisions

- **SUP-DD-01 — Classic plugin first** (silverpoint D7): an npm package registered in
  `MainPreset.js`, which needs a custom Superset frontend build. It is the documented, stable path.
- **SUP-DD-02 — One plugin per chart, generated.** Superset's chart gallery is a list of viz types;
  a single "Silverpoint" type with a chart picker would need a control panel that reshapes itself.
  `scripts/make-plugins.ts` writes `src/plugins/<slug>/{index,controlPanel,buildQuery}.ts` (H-3).
- **SUP-DD-03 — `.supx` is a PoC, not a plan.** SUP-T-02 answers whether Superset's Extensions
  framework can contribute a chart type at runtime. If yes, a second artefact is specified as a
  delta; if no, the finding is recorded and revisited each Superset minor.
- **SUP-DD-04 — React components, not the embed client.** Superset is React: the adapter gives
  server-free rendering inside its tree, its error boundaries and its sizing. The embed contributes
  only the DOM-free `/hosts` entry.
