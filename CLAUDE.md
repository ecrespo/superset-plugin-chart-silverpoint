# superset-plugin-chart-silverpoint — context for agents

Read [`specs/constitution.md`](specs/constitution.md) before proposing or writing code. It inherits
H-1..H-8 from silverpoint (`changes/feature-007-bi-hosts/repositories/README.md` §3: one engine, a
pinned line, generated manifests, conformance, nothing lost on the way in, the host's rules, specs as
the source, shown not inferred) and adds:

- **SUP-Art. 1 — Superset queries, silverpoint draws.** Aggregation, filtering, sorting and row limits are the query's. `transformProps` binds columns to roles and does nothing else to the data.
- **SUP-Art. 2 — Superset's packages are peers.** `@superset-ui/core`, `@superset-ui/chart-controls`, `react` and `react-dom` SHALL be `peerDependencies`, at the ranges of the supported Superset versions, stated in the README.

Draws with: `@silverpoint/react` (a dependency), `@silverpoint/embed/hosts` for the binding.

Stack: TypeScript; React; the build of Superset's plugin generator; Jest or Vitest as the generator gives; a Superset checkout in CI for the integration test.

Specs: `specs/prd.md` (SUP-REQ-001..SUP-REQ-012), `specs/technical-design.md`, `specs/tasks.md`.
`specs/spec-pack.md` is the pack as written in silverpoint's `changes/feature-007-bi-hosts/repositories/`;
the four files are its split, unchanged.

## Status

Implemented 2026-11-21: SUP-T-01, -03..-06; 2026-11-22: followed silverpoint 0.11 (`@silverpoint/embed`
from npm, `vendor/` retired), SUP-T-07 and SUP-T-02's live half (Superset master in `docker/compose.yml`,
`npm run e2e:superset`). Ledger in `specs/tasks.md`, findings in `specs/poc.md`. Open: `.supx`, the release.

Commands: `npm install --legacy-peer-deps`, `npm run check`, `npm run kit`, `npm run typecheck`,
`npm test`, `npm run build`, `npm run conformance`, `npm run e2e`, `npm run e2e:superset` (needs
`docker compose -f docker/compose.yml up --build -d --wait`, see its header).

- `src/plugins/`, `src/*.generated.ts` and `src/thumbnails.lock.json` are written only by
  `scripts/make-plugins.ts` (thumbnails need Chromium); `scripts/engine.ts` verifies the pinned engine.
- Unit tests run against the npm `@superset-ui/*` 0.20, which lag Superset master: what master changed
  (e.g. `t` in `@apache-superset/core/translation`) only the live run catches.

## Working rules

- Test-first; every task and test cites the SUP-REQ it implements or verifies (H-7, H-8).
- Every list of charts, roles, options and appearance values is generated from the pinned
  `host-catalog.json`, with a `--check` CI runs (H-3). Nothing in those lists is typed by hand.
- The engine is one pinned version of one silverpoint line, verified against `integrity.json` (H-2);
  the hosts kit is the zip attached to each silverpoint GitHub release.
- Specs and code are written in English.
