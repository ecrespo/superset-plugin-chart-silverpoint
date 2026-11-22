// @vitest-environment node
// SUP-REQ-011, SUP-Art. 2: the plugin's imports type-check against Superset master's own packages, so a
// change master makes to them (an export moved, as `t` was) fails in seconds, not after a Superset
// build. scripts/superset-api.ts maps the packages to master's source; only src/ is judged.
import { describe, expect, test } from 'vitest';
import { ourDiagnostics, supersetPaths } from '../scripts/superset-api.ts';

describe('superset-api', () => {
  test('SUP-REQ-011 · the three packages map to master\'s source', () => {
    const paths = supersetPaths('/s/superset-frontend');
    expect(paths['@superset-ui/core']).toEqual(['/s/superset-frontend/packages/superset-ui-core/src/index.ts']);
    expect(paths['@superset-ui/chart-controls']).toEqual(['/s/superset-frontend/packages/superset-ui-chart-controls/src/index.ts']);
    expect(paths['@apache-superset/core/*']).toEqual(['/s/superset-frontend/packages/superset-core/src/*']);
  });

  test('SUP-REQ-011 · errors in master\'s own files are not the plugin\'s', () => {
    const root = '/p/';
    const diagnostics = [
      { file: '/p/src/shared/plugin.ts', code: 2305, message: "Module '\"@superset-ui/core\"' has no exported member 't'." },
      { file: '/s/superset-frontend/packages/superset-ui-core/src/x.ts', code: 2307, message: "Cannot find module 'lodash'" },
      { file: undefined, code: 6053, message: 'global' },
    ];
    expect(ourDiagnostics(diagnostics, root)).toEqual([diagnostics[0]]);
  });
});
