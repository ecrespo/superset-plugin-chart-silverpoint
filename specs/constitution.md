# `superset-plugin-chart-silverpoint` — Constitution

> Split from `specs/spec-pack.md` (silverpoint feature-007, `repositories/`), content unchanged.

## Constitution

H-1..H-8, and:

- **SUP-Art. 1 — Superset queries, silverpoint draws.** Aggregation, filtering, sorting and row
  limits are the query's. `transformProps` binds columns to roles and does nothing else to the data.
- **SUP-Art. 2 — Superset's packages are peers.** `@superset-ui/core`, `@superset-ui/chart-controls`,
  `react` and `react-dom` SHALL be `peerDependencies`, at the ranges of the supported Superset
  versions, stated in the README.

Stack: TypeScript; React; the build of Superset's plugin generator; Jest or Vitest as the generator
gives; a Superset checkout in CI for the integration test.

## Identity

| Field | Value |
|---|---|
| **Repository** | `github.com/ecrespo/superset-plugin-chart-silverpoint` |
| **Published as** | npm `superset-plugin-chart-silverpoint` |
| **Licence** | MIT |
| **Description** | Apache Superset visualization plugins that draw silverpoint charts. |
| **Draws with** | `@silverpoint/react` (a dependency), `@silverpoint/embed/hosts` for the binding |
| **Wave** | 0 (PoC on `@silverpoint/react` 0.10), then 1 |
| **Ids** | `SUP-REQ-nnn`, `SUP-DD-nn`, `SUP-T-nn` |
| **Status** | `APPROVED` gate-1 pack, 2026-11-20 (user decision); re-read against the released API in T-328 |
