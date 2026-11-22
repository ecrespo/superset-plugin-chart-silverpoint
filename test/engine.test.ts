// @vitest-environment node
// H-2, SUP-REQ-012: the engine is one version of one silverpoint line — every @silverpoint package
// the plugin depends on or resolves, the catalog and the kit's cases — and its standalone files match
// integrity.json, the npm package's and the hosts kit's alike.
import { describe, expect, test } from 'vitest';
import { engineProblems, kitProblems, loadState, type EngineState } from '../scripts/engine.ts';

const clone = (state: EngineState): EngineState => structuredClone(state);

describe('engine (H-2)', () => {
  const state = loadState();

  test('H-2 · the installed engine is the pinned line, in one version', () => {
    expect(state.pkg.silverpoint).toEqual({ line: '0.11', engine: '0.11.1' });
    expect(engineProblems(state)).toEqual([]);
  });

  test('H-2 · a dependency on another version fails', () => {
    const s = clone(state);
    s.pkg.dependencies['@silverpoint/react'] = '0.11.0';
    expect(engineProblems(s)).toContain('@silverpoint/react 0.11.0 is not the engine 0.11.1');
  });

  test('H-2 · a second resolved version fails', () => {
    const s = clone(state);
    s.lockVersions.push({ path: 'node_modules/x/node_modules/@silverpoint/core', version: '0.10.1' });
    expect(engineProblems(s)).toContain('node_modules/x/node_modules/@silverpoint/core resolves 0.10.1, not 0.11.1');
  });

  test('H-2 · the line is major.minor of the engine', () => {
    const s = clone(state);
    s.pkg.silverpoint.line = '0.10';
    expect(engineProblems(s)).toContain('silverpoint.line 0.10 is not the line of 0.11.1');
  });

  test('H-2 · a standalone file that does not match integrity.json fails', () => {
    const s = clone(state);
    s.integrity['silverpoint-embed.js'] = 'sha384-tampered';
    expect(engineProblems(s)).toContain('silverpoint-embed.js does not match integrity.json');
  });

  test('H-2 · the README states the line', () => {
    const s = clone(state);
    s.readme = s.readme.replace(/silverpoint 0\.11/g, 'silverpoint');
    expect(engineProblems(s)).toContain('README.md does not state "silverpoint 0.11"');
  });

  test('H-2 · the hosts kit is compared file by file', () => {
    const files = { 'integrity.json': Buffer.from('{}'), 'host-catalog.json': Buffer.from('a') };
    expect(kitProblems(files, { 'integrity.json': Buffer.from('{}'), 'host-catalog.json': Buffer.from('a') })).toEqual([]);
    expect(kitProblems(files, { 'integrity.json': Buffer.from('{}'), 'host-catalog.json': Buffer.from('b') })).toEqual(['host-catalog.json differs from the hosts kit']);
    expect(kitProblems(files, { 'integrity.json': Buffer.from('{}') })).toEqual(['host-catalog.json is not in the hosts kit']);
  });
});
