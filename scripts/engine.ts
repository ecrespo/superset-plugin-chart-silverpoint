// H-2, SUP-REQ-012: the engine is exactly one version of one silverpoint line. Replaces the vendoring
// of SUP-D1 now that @silverpoint/embed is on npm: the plugin resolves its module entries from
// node_modules, and this script verifies what it resolves.
//   node scripts/engine.ts --check   pins, the lockfile, the catalog and kit cases, integrity.json
//   node scripts/engine.ts --kit     also the GitHub release's hosts kit against the npm package
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const EMBED = join(ROOT, 'node_modules/@silverpoint/embed');
/** The files the hosts kit and the npm package's dist/ both carry, compared byte for byte. */
const KIT_FILES = ['integrity.json', 'host-catalog.json', 'conformance.json', 'silverpoint-embed.js', 'silverpoint-embed.mjs', 'silverpoint-embed.full.js', 'silverpoint-embed.full.mjs'];

interface Manifest { dependencies: Record<string, string>; silverpoint: { line: string; engine: string } }
export interface EngineState {
  pkg: Manifest;
  /** Every @silverpoint package the lockfile resolves, at any depth. */
  lockVersions: { path: string; version: string }[];
  embedVersion: string;
  catalogVersion: string;
  casesVersion: string;
  integrity: Record<string, string>;
  /** sha384 of each standalone file as installed. */
  standalone: Record<string, string>;
  readme: string;
}

const sha384 = (bytes: Buffer): string => `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

export function loadState(root = ROOT): EngineState {
  const embed = join(root, 'node_modules/@silverpoint/embed');
  const integrity = json(join(embed, 'dist/integrity.json')) as Record<string, string>;
  const lock = json(join(root, 'package-lock.json')) as { packages: Record<string, { version?: string }> };
  return {
    pkg: json(join(root, 'package.json')),
    lockVersions: Object.entries(lock.packages).filter(([path]) => /(^|\/)node_modules\/@silverpoint\/[^/]+$/.test(path)).map(([path, p]) => ({ path, version: p.version ?? '' })),
    embedVersion: json(join(embed, 'package.json')).version,
    catalogVersion: json(join(embed, 'dist/host-catalog.json')).version,
    casesVersion: json(join(embed, 'dist/conformance.json')).version,
    integrity,
    standalone: Object.fromEntries(Object.keys(integrity).map((name) => [name, sha384(readFileSync(join(embed, 'dist', name)))])),
    readme: readFileSync(join(root, 'README.md'), 'utf8'),
  };
}

export function engineProblems(s: EngineState): string[] {
  const engine = s.pkg.silverpoint.engine;
  const problems: string[] = [];
  const line = engine.split('.').slice(0, 2).join('.');
  if (s.pkg.silverpoint.line !== line) problems.push(`silverpoint.line ${s.pkg.silverpoint.line} is not the line of ${engine}`);
  for (const [name, range] of Object.entries(s.pkg.dependencies)) {
    if (name.startsWith('@silverpoint/') && range !== engine) problems.push(`${name} ${range} is not the engine ${engine}`);
  }
  if (s.pkg.dependencies['@silverpoint/embed'] === undefined) problems.push('@silverpoint/embed is not a dependency');
  for (const { path, version } of s.lockVersions) {
    if (version !== engine) problems.push(`${path} resolves ${version}, not ${engine}`);
  }
  for (const [what, version] of [['installed @silverpoint/embed', s.embedVersion], ['host-catalog.json', s.catalogVersion], ['conformance.json', s.casesVersion]] as const) {
    if (version !== engine) problems.push(`${what} is ${version}, not ${engine}`);
  }
  for (const [name, digest] of Object.entries(s.integrity)) {
    if (s.standalone[name] !== digest) problems.push(`${name} does not match integrity.json`);
  }
  if (!s.readme.includes(`silverpoint ${line}`)) problems.push(`README.md does not state "silverpoint ${line}"`);
  return problems;
}

/** The npm package's files against the hosts kit's, by name. */
export function kitProblems(npm: Record<string, Buffer>, kit: Record<string, Buffer>): string[] {
  return Object.entries(npm).flatMap(([name, bytes]) => {
    const other = kit[name];
    if (!other) return [`${name} is not in the hosts kit`];
    return other.equals(bytes) ? [] : [`${name} differs from the hosts kit`];
  });
}

/** silverpoint-hosts-kit-<engine>.zip from the GitHub release, unzipped. */
function downloadKit(engine: string): Record<string, Buffer> {
  const tmp = mkdtempSync(join(tmpdir(), 'sp-kit-'));
  try {
    const zip = join(tmp, 'kit.zip');
    execFileSync('curl', ['-fsSL', '-o', zip, `https://github.com/ecrespo/silverpoint/releases/download/v${engine}/silverpoint-hosts-kit-${engine}.zip`], { stdio: 'inherit' });
    execFileSync('unzip', ['-q', zip, '-d', join(tmp, 'kit')]);
    const dir = join(tmp, 'kit');
    return Object.fromEntries(readdirSync(dir).filter((n) => KIT_FILES.includes(n)).map((n) => [n, readFileSync(join(dir, n))]));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!existsSync(EMBED)) {
    console.log('✗ @silverpoint/embed is not installed: run npm install');
    process.exit(1);
  }
  const state = loadState();
  const problems = engineProblems(state);
  if (process.argv.includes('--kit')) {
    const npm = Object.fromEntries(KIT_FILES.map((n) => [n, readFileSync(join(EMBED, 'dist', n))]));
    problems.push(...kitProblems(npm, downloadKit(state.pkg.silverpoint.engine)));
  } else if (!process.argv.includes('--check')) {
    console.log('give --check or --kit');
    process.exit(2);
  }
  for (const p of problems) console.log('✗', p);
  console.log(problems.length === 0
    ? `engine ok: silverpoint ${state.pkg.silverpoint.line} (${state.pkg.silverpoint.engine}), ${state.lockVersions.length} @silverpoint packages, ${Object.keys(state.integrity).length} standalone files match integrity.json${process.argv.includes('--kit') ? ', the hosts kit matches the npm package' : ''}`
    : `${problems.length} problem(s)`);
  process.exit(problems.length === 0 ? 0 : 1);
}
