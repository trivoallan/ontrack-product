// The scenarios of the adr-checks spec, each run against a throwaway git
// repository holding copies of this package's ADRs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(pkg, 'checks', 'ontrack-product-check.ts');
const shipped = readdirSync(join(pkg, 'adr')).filter((f) => /^ADR-\d{4}-.*\.md$/.test(f));

// A copy of a shipped ADR, ruled: status, date and authors set, the given
// trait lines in place of the empty ones, the how-to-rule block gone.
function ruled(number: string, traits: string, status = 'accepted'): string {
  const file = shipped.find((f) => f.startsWith(`${number}-`))!;
  let text = readFileSync(join(pkg, 'adr', file), 'utf8')
    .replace(/^status: .*$/m, `status: ${status}`)
    .replace(/^date:.*$/m, 'date: 2026-11-21')
    .replace(/^authors: .*$/m, 'authors: [Test Person]')
    .replace(/Everything below disappears when you rule[\s\S]*?(?=## Consequences)/, 'Adopted as recommended.\n\n');
  if (status !== 'proposed') text = text.replace(/^traits:\n(?: {2,}.*\n)+/m, traits ? `traits:\n  product:\n${traits}\n` : '');
  return text;
}

type Pair = readonly [string, string];
const ADR = {
  '0002': (v: string): Pair => ['ADR-0002-toolkit.md', ruled('ADR-0002', `    toolkit: ${v}`)],
  '0003': (v: string): Pair => ['ADR-0003-location.md', ruled('ADR-0003', `    artifacts:\n      root: ${v}`)],
  '0004': (levels = '[hypothesis, observed, validated]', required = 'observed'): Pair =>
    ['ADR-0004-evidence.md', ruled('ADR-0004', `    evidence:\n      levels: ${levels}\n      required: ${required}`)],
  '0005': (v: string): Pair => ['ADR-0005-handoff.md', ruled('ADR-0005', `    handoff: ${v}`)],
};

const prd = (evidence?: string, artifact = 'prd') =>
  `---\n${artifact ? `artifact: ${artifact}\n` : ''}version: "1.0"\ncreated: 2026-11-21\nstatus: draft\n${evidence ? `evidence: ${evidence}\n` : ''}---\n\n# PRD\n\nValidated by everyone.\n`;

// A git repository with `files` written and added, ADRs under docs/adr/product/.
function repo(files: Record<string, string>, adrs: Pair[] = []): string {
  const root = mkdtempSync(join(tmpdir(), 'ontrack-product-'));
  const all = { ...files, ...Object.fromEntries(adrs.map(([f, t]) => [`docs/adr/product/${f}`, t])) };
  for (const [path, text] of Object.entries(all)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  spawnSync('git', ['init', '-q'], { cwd: root });
  spawnSync('git', ['add', '-A'], { cwd: root });
  return root;
}

function run(root: string, ...args: string[]) {
  const before = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout;
  const r = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
  const after = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout;
  assert.equal(after, before, 'the check changed the repository');
  return { code: r.status, out: r.stdout, err: r.stderr };
}

// --- The command.

test('usage names the command', () => {
  const r = run(repo({}));
  assert.notEqual(r.code, 0);
  assert.match(r.err, /^usage: ontrack-product-check <ADR number>/);
});

test('unknown ADR', () => {
  const r = run(repo({}), 'ADR-0009');
  assert.notEqual(r.code, 0);
  assert.match(r.err, /ships no check for ADR-0009/);
});

test('ADR missing names the pattern', () => {
  const r = run(repo({}), 'ADR-0003');
  assert.notEqual(r.code, 0);
  assert.match(r.err, /no file matches docs\/adr\/\*\/ADR-0003-\*\.md/);
});

test('two copies are refused', () => {
  const [f, t] = ADR['0003']('research/');
  const r = run(repo({ [`docs/adr/other/${f}`]: t, 'research/.gitkeep': '' }, [[f, t]]), 'ADR-0003');
  assert.notEqual(r.code, 0);
  assert.match(r.err, /several files match/);
});

test('docs/adr/local is never read', () => {
  const [f, t] = ADR['0003']('research/');
  const r = run(repo({ [`docs/adr/local/${f}`]: t, 'research/.gitkeep': '' }), 'ADR-0003');
  assert.notEqual(r.code, 0);
  assert.match(r.err, /no file matches/);
});

test('every shipped check: line names its own ADR', () => {
  for (const f of shipped) {
    const n = f.slice(0, 8);
    assert.match(readFileSync(join(pkg, 'adr', f), 'utf8'), new RegExp(`^check: npx --no-install ontrack-product-check ${n}$`, 'm'), f);
  }
});

// --- Unruled or missing traits.

test('empty key: the ADR is not ruled', () => {
  const r = run(repo({ 'research/.gitkeep': '' }, [ADR['0004']('[hypothesis, observed, validated]', ''), ADR['0003']('research/')]), 'ADR-0004');
  assert.notEqual(r.code, 0);
  assert.match(r.err, /ADR-0004: product\.evidence\.required is not set .*not ruled/);
});

test('dependency not accepted', () => {
  const r = run(repo({ 'research/.gitkeep': '' }, [ADR['0004'](), ['ADR-0003-location.md', ruled('ADR-0003', '', 'proposed')]]), 'ADR-0004');
  assert.notEqual(r.code, 0);
  assert.match(r.err, /ADR-0004: ADR-0003 must be accepted first/);
});

// --- ADR-0001.

test('ADR-0001: nothing ruled but itself passes', () => {
  const adrs = shipped.map((f) => [f, readFileSync(join(pkg, 'adr', f), 'utf8')] as Pair);
  const r = run(repo({}, adrs), 'ADR-0001');
  assert.equal(r.code, 0, r.out + r.err);
});

test('ADR-0001: a half-ruled copy fails and is named', () => {
  const half = readFileSync(join(pkg, 'adr', 'ADR-0002-toolkit.md'), 'utf8').replace(/^status: proposed$/m, 'status: accepted');
  const r = run(repo({}, [['ADR-0001-record-product-decisions.md', readFileSync(join(pkg, 'adr', 'ADR-0001-record-product-decisions.md'), 'utf8')], ['ADR-0002-toolkit.md', half]]), 'ADR-0001');
  assert.notEqual(r.code, 0);
  assert.match(r.out, /ADR-0002-toolkit\.md/);
});

test('ADR-0001: a ruled copy with no authors fails', () => {
  const [f, t] = ADR['0003']('research/');
  const r = run(repo({}, [['ADR-0001-record-product-decisions.md', readFileSync(join(pkg, 'adr', 'ADR-0001-record-product-decisions.md'), 'utf8')], [f, t.replace(/^authors: .*$/m, 'authors: []')]]), 'ADR-0001');
  assert.notEqual(r.code, 0);
  assert.match(r.out, /ADR-0003-location\.md is ruled and names no authors/);
});

test('ADR-0001: fully ruled copies pass, rejected without traits included', () => {
  const r = run(repo({}, [
    ['ADR-0001-record-product-decisions.md', readFileSync(join(pkg, 'adr', 'ADR-0001-record-product-decisions.md'), 'utf8')],
    ADR['0003']('research/'),
    ADR['0004'](),
    ['ADR-0005-handoff.md', ruled('ADR-0005', '', 'rejected')],
  ]), 'ADR-0001');
  assert.equal(r.code, 0, r.out + r.err);
});

test('ADR-0001: no ruled copy at all', () => {
  const r = run(repo({}, [['ADR-0001-record-product-decisions.md', '---\nadr: ADR-0001\nstatus: proposed\n---\n']]), 'ADR-0001');
  assert.equal(r.code, 0);
  assert.match(r.out, /no ADR is ruled yet/);
});

// --- ADR-0002.

test('ADR-0002: artifact without type', () => {
  const r = run(repo({ 'research/notes.md': '# notes\n', 'research/prd.md': prd('hypothesis') }, [ADR['0002']('pm-skills'), ADR['0003']('research/')]), 'ADR-0002');
  assert.notEqual(r.code, 0);
  assert.match(r.out, /research\/notes\.md has no artifact: key/);
  assert.doesNotMatch(r.out, /research\/prd\.md/);
});

test('ADR-0002: typed artifacts pass', () => {
  const r = run(repo({ 'research/prd.md': prd('hypothesis') }, [ADR['0002']('pm-skills'), ADR['0003']('research/')]), 'ADR-0002');
  assert.equal(r.code, 0, r.out + r.err);
});

test('ADR-0002: other toolkit has nothing to check', () => {
  const r = run(repo({}, [ADR['0002']('nanopm')]), 'ADR-0002');
  assert.equal(r.code, 0);
  assert.match(r.out, /nothing to check/);
});

test('ADR-0002: unknown toolkit', () => {
  const r = run(repo({}, [ADR['0002']('notion')]), 'ADR-0002');
  assert.notEqual(r.code, 0);
  assert.match(r.err, /unknown value: notion/);
});

// --- ADR-0003.

test('ADR-0003: artifact outside the root', () => {
  const r = run(repo({ 'research/.gitkeep': '', 'docs/prd-search.md': prd('observed') }, [ADR['0003']('research/')]), 'ADR-0003');
  assert.notEqual(r.code, 0);
  assert.match(r.out, /docs\/prd-search\.md is a product artifact outside research\//);
});

test('ADR-0003: root missing', () => {
  const r = run(repo({}, [ADR['0003']('research/')]), 'ADR-0003');
  assert.notEqual(r.code, 0);
  assert.match(r.err, /research\/, and that directory does not exist/);
});

test('ADR-0003: root leaving the repository', () => {
  for (const v of ['../elsewhere', '/abs']) {
    const r = run(repo({}, [ADR['0003'](v)]), 'ADR-0003');
    assert.notEqual(r.code, 0, v);
    assert.match(r.err, /not a directory inside the repository/, v);
  }
});

test('ADR-0003: artifacts in place pass, untyped Markdown outside ignored', () => {
  const r = run(repo({ 'research/a/prd.md': prd('observed'), 'README.md': '# hi\n' }, [ADR['0003']('research')]), 'ADR-0003');
  assert.equal(r.code, 0, r.out + r.err);
});

test('ADR-0003: a tracked file deleted from disk is skipped, not read', () => {
  const root = repo({ 'research/prd.md': prd('observed'), 'notes/gone.md': '# gone\n' }, [ADR['0003']('research')]);
  rmSync(join(root, 'notes/gone.md'));
  const r = run(root, 'ADR-0003');
  assert.equal(r.code, 0, r.out + r.err);
});

// --- A superseded ADR: the check reads the ADR that supersedes it.

// A repository's own decision in docs/adr/local/, superseding `supersedes`.
const local = (file: string, supersedes: string, traits: string, status = 'accepted'): Record<string, string> => ({
  [`docs/adr/local/${file}`]: `---\nadr: ${file.slice(0, 8)}\nstatus: ${status}\nsupersedes: [${supersedes}]\ntraits:\n  product:\n${traits}\n---\n\n# Local\n`,
});

test('superseded ADR-0003: the root comes from the local ADR that supersedes it', () => {
  const files = {
    ...local('ADR-0031-wiki.md', 'product/ADR-0003', '    artifacts:\n      root: wiki/'),
    'wiki/prd.md': prd(),
    'research/prd.md': prd('observed'),
  };
  const r = run(repo(files, [ADR['0004'](), ADR['0003']('research/')]), 'ADR-0004');
  assert.notEqual(r.code, 0);
  assert.match(r.out, /wiki\/prd\.md has no evidence: key/);
  assert.doesNotMatch(r.out, /research\//);
});

test('superseded ADR-0003: a chain is followed, a bare name resolves in its own directory', () => {
  const files = {
    ...local('ADR-0031-wiki.md', 'product/ADR-0003', '    artifacts:\n      root: wiki/'),
    ...local('ADR-0032-notes.md', 'ADR-0031-wiki', '    artifacts:\n      root: notes/'),
    'notes/prd.md': prd('observed'),
    'wiki/prd.md': prd(),
  };
  const r = run(repo(files, [ADR['0004'](), ADR['0003']('research/')]), 'ADR-0004');
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(r.out, /1 product artifact\(s\) under notes\//);
});

test('superseded ADR-0003: a proposed ADR supersedes nothing', () => {
  const files = { ...local('ADR-0031-wiki.md', 'product/ADR-0003', '    artifacts:\n      root: wiki/', 'proposed'), 'research/prd.md': prd('observed') };
  const r = run(repo(files, [ADR['0004'](), ADR['0003']('research/')]), 'ADR-0004');
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(r.out, /under research\//);
});

test('superseded ADR-0002: the check runs on the superseding ruling', () => {
  const files = local('ADR-0030-nanopm.md', 'product/ADR-0002', '    toolkit: nanopm');
  const r = run(repo(files, [ADR['0002']('pm-skills')]), 'ADR-0002');
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(r.out, /product\.toolkit is nanopm/);
});

test('superseded ADR-0001: ruled copies are still read from the track directory', () => {
  const adrs = shipped.map((f) => [f, readFileSync(join(pkg, 'adr', f), 'utf8')] as Pair);
  const files = local('ADR-0040-records.md', 'product/ADR-0001', '    records: nygard');
  const r = run(repo(files, adrs), 'ADR-0001');
  assert.equal(r.code, 0, r.out + r.err);
});

// --- ADR-0004.

const ev =(files: Record<string, string>, levels?: string, required?: string) =>
  run(repo(files, [ADR['0004'](levels, required), ADR['0003']('research/')]), 'ADR-0004');

test('ADR-0004: missing evidence', () => {
  const r = ev({ 'research/prd-search.md': prd() });
  assert.notEqual(r.code, 0);
  assert.match(r.out, /research\/prd-search\.md has no evidence: key/);
});

test('ADR-0004: unknown level', () => {
  const r = ev({ 'research/prd.md': prd('proven') });
  assert.notEqual(r.code, 0);
  assert.match(r.out, /evidence: proven, not one of hypothesis, observed, validated/);
});

test('ADR-0004: hypothesis allowed to exist; body ignored', () => {
  const r = ev({ 'research/prd.md': prd('hypothesis'), 'research/b/c.md': prd('validated') });
  assert.equal(r.code, 0, r.out + r.err);
});

test('ADR-0004: bad levels', () => {
  assert.match(ev({}, '[a, a]', 'a').err, /lists a twice/);
  assert.match(ev({}, '[a, b]', 'c').err, /required is c, which is not one of/);
  assert.match(ev({}, 'a', 'a').err, /levels is not a list/);
  assert.match(ev({}, '[]', 'a').err, /levels is not set/);
});

test('ADR-0004: block-list levels are read', () => {
  const r = ev({ 'research/prd.md': prd('observed') }, '\n        - hypothesis\n        - observed');
  assert.equal(r.code, 0, r.out + r.err);
});

// --- ADR-0005.

const change = (proposal: string) => ({ 'openspec/changes/add-search/proposal.md': `# Proposal\n\n${proposal}\n` });
const gate = (files: Record<string, string>) =>
  run(repo({ 'research/prd-search.md': prd('hypothesis'), 'research/prd-ok.md': prd('observed'), ...files }, [ADR['0005']('openspec'), ADR['0004'](), ADR['0003']('research/')]), 'ADR-0005');

test('ADR-0005: change on an unsupported PRD', () => {
  const r = gate(change('PRD: research/prd-search.md'));
  assert.notEqual(r.code, 0);
  assert.match(r.out, /change add-search cites PRD research\/prd-search\.md at evidence: hypothesis, below observed/);
});

test('ADR-0005: probe declared', () => {
  const r = gate(change('PRD: `research/prd-search.md`\nProbe: users who search twice abandon less; observed in the funnel for two weeks'));
  assert.equal(r.code, 0, r.out + r.err);
});

test('ADR-0005: empty probe does not count', () => {
  assert.notEqual(gate(change('PRD: research/prd-search.md\nProbe:   ')).code, 0);
});

test('ADR-0005: supported PRD, and a proposal citing none', () => {
  const r = gate({ ...change('PRD: research/prd-ok.md'), 'openspec/changes/chore/proposal.md': '# Proposal\n' });
  assert.equal(r.code, 0, r.out + r.err);
});

test('ADR-0005: cited file not a product artifact', () => {
  const r = gate(change('PRD: docs/old-prd.md'));
  assert.notEqual(r.code, 0);
  assert.match(r.out, /docs\/old-prd\.md, which is not a product artifact tracked under research\//);
});

test('ADR-0005: cited PRD without a level', () => {
  const r = gate({ ...change('PRD: research/none.md'), 'research/none.md': prd() });
  assert.notEqual(r.code, 0);
  assert.match(r.out, /evidence: \(none\) is not one of/);
});

test('ADR-0005: archived change ignored', () => {
  const r = gate({ 'openspec/changes/archive/2026-01-01-x/proposal.md': 'PRD: research/prd-search.md\n' });
  assert.equal(r.code, 0, r.out + r.err);
});

test('ADR-0005: none has nothing to check', () => {
  const r = run(repo({}, [ADR['0005']('none')]), 'ADR-0005');
  assert.equal(r.code, 0);
  assert.match(r.out, /nothing to check/);
});

test('ADR-0005: needs ADR-0004 accepted', () => {
  const r = run(repo({ 'research/.gitkeep': '' }, [ADR['0005']('openspec'), ADR['0003']('research/'), ['ADR-0004-evidence.md', ruled('ADR-0004', '', 'rejected')]]), 'ADR-0005');
  assert.notEqual(r.code, 0);
  assert.match(r.err, /ADR-0005: ADR-0004 must be accepted first \(it is rejected\)/);
});
