// SUP-REQ-011, SUP-Art. 2: type-checks src/ against Superset master's @superset-ui/core,
// @superset-ui/chart-controls and @apache-superset/core — their source, from a sparse checkout, no
// `npm ci`. The unit tests run on the published 0.20 packages, which lag master; this is the fast
// guard for what master changes (an export moved, a type changed). Errors inside master's own files
// (their dependencies are not installed) are not the plugin's and are left out.
//   node scripts/superset-api.ts [superset-frontend dir]   default: .superset/superset-frontend,
//                                                          cloned (sparse, master) when missing
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

export function supersetPaths(frontend: string): Record<string, string[]> {
  const pkg = (name: string) => `${frontend}/packages/${name}/src`;
  return {
    '@superset-ui/core': [`${pkg('superset-ui-core')}/index.ts`],
    '@superset-ui/core/*': [`${pkg('superset-ui-core')}/*`],
    '@superset-ui/chart-controls': [`${pkg('superset-ui-chart-controls')}/index.ts`],
    '@apache-superset/core': [`${pkg('superset-core')}/index.ts`],
    '@apache-superset/core/*': [`${pkg('superset-core')}/*`],
  };
}

export interface Finding { file: string | undefined; code: number; message: string }

/** Only diagnostics in the plugin's own src/ count. */
export function ourDiagnostics(diagnostics: readonly Finding[], root = ROOT): Finding[] {
  const src = join(root, 'src/');
  return diagnostics.filter((d) => d.file !== undefined && d.file.startsWith(src));
}

function checkout(dir: string): void {
  const repo = resolve(dir, '..');
  console.log(`cloning Superset master's frontend packages into ${repo} (sparse)`);
  execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--sparse', 'https://github.com/apache/superset.git', repo], { stdio: 'inherit' });
  execFileSync('git', ['-C', repo, 'sparse-checkout', 'set', 'superset-frontend/packages/superset-ui-core', 'superset-frontend/packages/superset-ui-chart-controls', 'superset-frontend/packages/superset-core'], { stdio: 'inherit' });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ts = (await import('typescript')).default;
  const frontend = resolve(process.argv[2] ?? join(ROOT, '.superset/superset-frontend'));
  if (!existsSync(join(frontend, 'packages/superset-ui-core'))) checkout(frontend);
  const commit = (() => { try { return execFileSync('git', ['-C', frontend, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } })();
  const base = ts.getParsedCommandLineOfConfigFile(join(ROOT, 'tsconfig.json'), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: (d) => { throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n')); } })!;
  const files = base.fileNames.filter((f) => f.startsWith(join(ROOT, 'src/')));
  const program = ts.createProgram(files, { ...base.options, noEmit: true, baseUrl: ROOT, paths: supersetPaths(frontend), types: ['node'] });
  const all: Finding[] = ts.getPreEmitDiagnostics(program).map((d) => ({ file: d.file?.fileName, code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') }));
  const ours = ourDiagnostics(all);
  const raw = ts.getPreEmitDiagnostics(program).filter((d) => d.file && d.file.fileName.startsWith(join(ROOT, 'src/')));
  for (const d of raw) {
    const { line, character } = d.file!.getLineAndCharacterOfPosition(d.start ?? 0);
    console.log(`✗ ${d.file!.fileName.slice(ROOT.length)}:${line + 1}:${character + 1} TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
  }
  console.log(`superset master ${commit}: ${files.length} files of src/ checked, ${ours.length} error(s) (${all.length - ours.length} inside master's packages, not judged)`);
  process.exit(ours.length === 0 ? 0 : 1);
}
