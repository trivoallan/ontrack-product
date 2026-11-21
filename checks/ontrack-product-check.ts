#!/usr/bin/env node
// ontrack-product-check <ADR number>
// Runs the check this package ships for one ADR, from the consuming repository's
// root, as called by that ADR's `check:` line through `ontrack check`. Reads
// frontmatter and declared lines only; writes nothing.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename, relative, isAbsolute, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

class CheckError extends Error {}

type Value = string | string[];
type Front = Record<string, Value>;

const USAGE = 'usage: ontrack-product-check <ADR number>';

// The directory under docs/adr/ holding this package's ADRs: the alias it is
// installed under, read from this script's path, node_modules/<alias>/dist/.
// Empty when the script runs from elsewhere (this package's own tests).
const pkg = dirname(dirname(fileURLToPath(import.meta.url)));
const NAMESPACE = basename(dirname(pkg)) === 'node_modules' ? basename(pkg) : '';

// The single repository copy of an ADR. Without a namespace, every directory
// of docs/adr/ but `local`, which holds the repository's own decisions.
function findAdr(root: string, number: string): string {
  const base = join(root, 'docs', 'adr');
  const pattern = `docs/adr/${NAMESPACE || '*'}/${number}-*.md`;
  const dirs = existsSync(base)
    ? readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory() && (NAMESPACE ? d.name === NAMESPACE : d.name !== 'local'))
    : [];
  const hits = dirs.flatMap((d) =>
    readdirSync(join(base, d.name)).filter((f) => f.startsWith(`${number}-`) && f.endsWith('.md')).map((f) => join(base, d.name, f)),
  );
  if (hits.length === 0) throw new CheckError(`${number}: no file matches ${pattern}`);
  if (hits.length > 1) throw new CheckError(`${number}: several files match ${pattern}: ${hits.join(', ')}`);
  return hits[0];
}

// A scalar as ontrack reads it: trailing ` # comment` cut, one pair of quotes removed.
function scalar(raw: string): string {
  let v = raw.replace(/\s+#.*$/, '').trim();
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v.at(-1) === v[0]) v = v.slice(1, -1);
  return v;
}

// The YAML frontmatter flattened to dotted keys (`traits.product.toolkit`).
// A value is a string, '' when empty, or a list (flow `[a, b]` or block `- a`).
// ponytail: an indentation reader for the shapes these ADRs and pm-skills
// templates use, not YAML (no anchors, no multi-line strings). A form it
// misses reads as a missing key, which fails, never a pass; switch to the
// `yaml` package if a real artifact breaks it.
function front(text: string): Front {
  const lines = text.split(/\r?\n/);
  const end = lines[0] === '---' ? lines.indexOf('---', 1) : -1;
  const out: Front = {};
  if (end === -1) return out;
  const stack: { indent: number; key: string }[] = [];
  let last = '';
  for (const line of lines.slice(1, end)) {
    const body = line.trim();
    if (!body || body.startsWith('#')) continue;
    const item = body.match(/^-\s*(.*)$/);
    if (item) {
      if (last) out[last] = [...(Array.isArray(out[last]) ? (out[last] as string[]) : []), scalar(item[1])];
      continue;
    }
    const kv = body.match(/^([\w.-]+):\s*(.*)$/);
    if (!kv) continue;
    const indent = line.length - line.trimStart().length;
    while (stack.length && stack.at(-1)!.indent >= indent) stack.pop();
    last = [...stack.map((s) => s.key), kv[1]].join('.');
    stack.push({ indent, key: kv[1] });
    const v = scalar(kv[2]);
    out[last] = v.startsWith('[') && v.endsWith(']') ? v.slice(1, -1).split(',').map(scalar).filter(Boolean) : v;
  }
  return out;
}

const read = (file: string) => front(readFileSync(file, 'utf8'));
const rel = (root: string, file: string) => relative(root, file);

// One ruled value: a non-empty string.
function one(f: Front, key: string, number: string, file: string, allowed?: string[]): string {
  const v = f[`traits.${key}`];
  if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) throw new CheckError(`${number}: ${key} is not set in ${file}; the ADR is not ruled`);
  if (Array.isArray(v)) throw new CheckError(`${number}: ${key} is not one value in ${file}`);
  if (allowed && !allowed.includes(v)) throw new CheckError(`${number}: ${key} has an unknown value: ${v} (allowed: ${allowed.join(', ')})`);
  return v;
}

// Another ADR of this track the check depends on, which must be accepted.
function accepted(root: string, number: string, by: string): { file: string; f: Front } {
  const path = findAdr(root, number);
  const f = read(path);
  if (f.status !== 'accepted') throw new CheckError(`${by}: ${number} must be accepted first (it is ${f.status || 'not ruled'})`);
  return { file: rel(root, path), f };
}

// Markdown files tracked by git, relative to the root, that are still on
// disk: a tracked file deleted from the working tree, not yet staged, is
// not there to read.
function tracked(root: string): string[] {
  const r = spawnSync('git', ['ls-files', '-z', '--', '*.md'], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) throw new CheckError(`git ls-files failed in ${root}: ${r.stderr.trim()}`);
  return r.stdout.split('\0').filter((p) => p && existsSync(join(root, p)));
}

const under = (dir: string, path: string) => dir === '.' || path.startsWith(`${dir}/`);

// ADR-0003's root, normalised without its trailing slash, refused outside the repository.
function artifactsRoot(f: Front, number: string, file: string): string {
  const raw = one(f, 'product.artifacts.root', number, file);
  const dir = normalize(raw).replace(/\/+$/, '') || '.';
  if (isAbsolute(raw) || dir === '..' || dir.startsWith('../')) throw new CheckError(`${number}: product.artifacts.root is ${raw}, which is not a directory inside the repository`);
  return dir;
}

function rootOf(root: string, by: string): string {
  const { file, f } = accepted(root, 'ADR-0003', by);
  return artifactsRoot(f, 'ADR-0003', file);
}

// ADR-0004's levels and required level, refused when they cannot rank anything.
function evidenceOf(f: Front, number: string, file: string): { levels: string[]; required: string } {
  const levels = f['traits.product.evidence.levels'];
  if (levels === undefined || levels === '' || (Array.isArray(levels) && !levels.length)) {
    throw new CheckError(`${number}: product.evidence.levels is not set in ${file}; the ADR is not ruled`);
  }
  if (!Array.isArray(levels)) throw new CheckError(`${number}: product.evidence.levels is not a list in ${file}`);
  const twice = levels.find((l, i) => levels.indexOf(l) !== i);
  if (twice) throw new CheckError(`${number}: product.evidence.levels lists ${twice} twice in ${file}`);
  const required = one(f, 'product.evidence.required', number, file);
  if (!levels.includes(required)) throw new CheckError(`${number}: product.evidence.required is ${required}, which is not one of product.evidence.levels (${levels.join(', ')})`);
  return { levels, required };
}

// Prints each failure, or the pass line, and returns the exit code.
function report(fails: string[], pass: string): number {
  if (fails.length) {
    for (const f of fails) console.log(f);
    return 1;
  }
  console.log(pass);
  return 0;
}

// --- ADR-0001: every ruled copy against adr/.mdschema.yml, plus named authors.
function adrs(root: string, file: string): number {
  const dir = dirname(file);
  const ruled = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f)).filter((f) => read(f).status !== 'proposed');
  if (!ruled.length) {
    console.log('ADR-0001: no ADR is ruled yet, nothing to check');
    return 0;
  }
  const schema = join(pkg, 'adr', '.mdschema.yml');
  const files = ruled.map((f) => rel(root, f));
  console.log(`ADR-0001: checking ${files.length} ruled ADR(s) against ${rel(root, schema)}`);
  const unnamed = ruled.filter((f) => !Array.isArray(read(f).authors) || !(read(f).authors as string[]).length);
  for (const f of unnamed) console.log(`ADR-0001: ${rel(root, f)} is ruled and names no authors`);
  // From this package, never the repository's node_modules/.bin nor PATH.
  const manifest = createRequire(import.meta.url).resolve('@jackchuka/mdschema/package.json');
  const cli = join(dirname(manifest), JSON.parse(readFileSync(manifest, 'utf8')).bin.mdschema);
  const r = spawnSync(process.execPath, [cli, 'check', '--schema', schema, ...files], { cwd: root, stdio: 'inherit' });
  if (r.error) throw r.error;
  return unnamed.length ? 1 : (r.status ?? 1);
}

// --- ADR-0002: with pm-skills, every product artifact says what kind it is.
function toolkit(root: string, file: string): number {
  const name = rel(root, file);
  const tool = one(read(file), 'product.toolkit', 'ADR-0002', name, ['pm-skills', 'nanopm', 'none']);
  if (tool !== 'pm-skills') {
    console.log(`ADR-0002: product.toolkit is ${tool}, whose artifacts carry no artifact: key; nothing to check`);
    return 0;
  }
  const dir = rootOf(root, 'ADR-0002');
  const found = tracked(root).filter((p) => under(dir, p));
  const fails = found.filter((p) => !front(readFileSync(join(root, p), 'utf8')).artifact).map((p) => `ADR-0002: ${p} has no artifact: key in its frontmatter`);
  return report(fails, `ADR-0002: ${found.length} product artifact(s) under ${dir}/ say what kind they are`);
}

// --- ADR-0003: the root exists, and no artifact lives outside it.
function location(root: string, file: string): number {
  const dir = artifactsRoot(read(file), 'ADR-0003', rel(root, file));
  if (!existsSync(join(root, dir)) || !statSync(join(root, dir)).isDirectory()) {
    throw new CheckError(`ADR-0003: product.artifacts.root is ${dir}/, and that directory does not exist`);
  }
  const fails = tracked(root)
    .filter((p) => !under(dir, p) && !!front(readFileSync(join(root, p), 'utf8')).artifact)
    .map((p) => `ADR-0003: ${p} is a product artifact outside ${dir}/`);
  return report(fails, `ADR-0003: every product artifact lives under ${dir}/`);
}

// --- ADR-0004: every product artifact declares a known evidence level.
function evidence(root: string, file: string): number {
  const { levels } = evidenceOf(read(file), 'ADR-0004', rel(root, file));
  const dir = rootOf(root, 'ADR-0004');
  const found = tracked(root).filter((p) => under(dir, p));
  const fails = found.flatMap((p) => {
    const v = front(readFileSync(join(root, p), 'utf8')).evidence;
    if (v === undefined || v === '') return [`ADR-0004: ${p} has no evidence: key in its frontmatter`];
    if (Array.isArray(v) || !levels.includes(v)) return [`ADR-0004: ${p} says evidence: ${v}, not one of ${levels.join(', ')}`];
    return [];
  });
  return report(fails, `ADR-0004: ${found.length} product artifact(s) under ${dir}/ declare their evidence`);
}

// --- ADR-0005: an open change that cites a PRD below the required level declares a probe.
function handoff(root: string, file: string): number {
  const mode = one(read(file), 'product.handoff', 'ADR-0005', rel(root, file), ['openspec', 'none']);
  if (mode === 'none') {
    console.log('ADR-0005: product.handoff is none; nothing to check');
    return 0;
  }
  const dir = rootOf(root, 'ADR-0005');
  const ev = accepted(root, 'ADR-0004', 'ADR-0005');
  const { levels, required } = evidenceOf(ev.f, 'ADR-0004', ev.file);
  const artifacts = new Set(tracked(root).filter((p) => under(dir, p)));
  const base = join(root, 'openspec', 'changes');
  const changes = existsSync(base)
    ? readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'archive' && existsSync(join(base, d.name, 'proposal.md'))).map((d) => d.name)
    : [];
  const fails: string[] = [];
  for (const change of changes) {
    const lines = readFileSync(join(base, change, 'proposal.md'), 'utf8').split(/\r?\n/);
    const probe = lines.some((l) => /^Probe:\s*\S/.test(l));
    for (const l of lines) {
      const m = l.match(/^PRD:\s*(.*?)\s*$/);
      if (!m) continue;
      const cited = normalize(m[1].replace(/^`(.*)`$/, '$1'));
      if (!artifacts.has(cited)) {
        fails.push(`ADR-0005: change ${change} cites PRD ${cited}, which is not a product artifact tracked under ${dir}/`);
        continue;
      }
      const level = front(readFileSync(join(root, cited), 'utf8')).evidence;
      const rank = typeof level === 'string' ? levels.indexOf(level) : -1;
      if (rank === -1) fails.push(`ADR-0005: change ${change} cites PRD ${cited}, whose evidence: ${level || '(none)'} is not one of ${levels.join(', ')}`);
      else if (rank < levels.indexOf(required) && !probe) {
        fails.push(`ADR-0005: change ${change} cites PRD ${cited} at evidence: ${level}, below ${required}, and its proposal has no Probe: line`);
      }
    }
  }
  return report(fails, `ADR-0005: ${changes.length} open change(s) checked against evidence ${required}`);
}

const CHECKS: Record<string, (root: string, file: string) => number> = {
  'ADR-0001': adrs,
  'ADR-0002': toolkit,
  'ADR-0003': location,
  'ADR-0004': evidence,
  'ADR-0005': handoff,
};

function main(argv: string[], root = process.cwd()): number {
  try {
    if (argv.length !== 1 || !argv[0]) throw new CheckError(USAGE);
    const [number] = argv;
    const check = CHECKS[number];
    if (!check) throw new CheckError(`this package ships no check for ${number}`);
    return check(root, findAdr(root, number));
  } catch (e) {
    if (!(e instanceof CheckError)) throw e;
    console.error(e.message);
    return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
