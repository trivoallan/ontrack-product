# Design

## Context

The repository is empty apart from OpenSpec. The model is
`trivoallan/ontrack-engineering` (v0.6.0): ADRs in `adr/`, one TypeScript
check script in `checks/` built with `tsc` to `dist/`, run with `node --test`,
`.mdschema.yml` next to the ADRs, release-please with `release-type: node`.
ontrack imports a track's ADRs into `docs/adr/<alias>/` and runs the `check:`
line of each `accepted` ADR from the repository root
(`docs/write-your-own-track.md` in `trivoallan/ontrack`). See proposal.md for
motivation and specs/ for requirements.

## Goals / Non-Goals

**Goals:**

- Same file layout, build, test and release setup as ontrack-engineering, so
  one person maintains both without relearning anything.
- A check per ADR that a repository can run in CI with no network.

**Non-Goals:**

- How an evidence level is raised or proven (an `Observed in:` line, links to
  interviews). ADR-0004 revision 2.
- Judging whether a `Probe:` is a real probe. Review does that.
- Parsing PRD bodies, or any artifact structure beyond frontmatter.
- Integrating with the engineering track (ADR-0016 `changes.framework`).
  ADR-0005 states its OpenSpec assumption in its own words.
- An OpenSpec schema of its own for this repository; it uses `spec-driven`.

## Decisions

**1. Copy the engineering skeleton, not depend on it.** `package.json`
scripts (`build: tsc`, `prepare`, `test` with `node --test` and 90 % line
coverage on `checks/*.ts`), `tsconfig.json`, release-please config and the CI
and release workflows are taken from ontrack-engineering and trimmed to what
this package uses. Alternative: a shared library of check helpers. Rejected:
two consumers, and the helpers (`findAdr`, trait reading) are about 100 lines.

**2. One script, a table from ADR number to check function**, as
`ontrack-engineering-check.ts` does. The namespace is read from the script's
own path (`node_modules/<alias>/dist/`), so a repository that installs the
track under another alias still works, and `docs/adr/local` is never read.

**3. Frontmatter read with a small reader, not a YAML library.** Engineering
reads traits with an indentation reader plus `zod` for validation; here one
reader flattens the frontmatter to dotted keys and five keys are validated by
hand, without `zod`, because the checks read scalar keys (`artifact:`,
`evidence:`, `status:`) and two-level trait blocks. A form it misses reads as
a missing key, which fails, never a silent pass. Upgrade path: the `yaml`
package if a real artifact breaks it.

**4. Product artifacts are listed with `git ls-files`.** Only tracked
Markdown under the root counts, so local drafts and `node_modules` never fail
a check, and the result is the same locally and in CI.

**5. Cross-ADR traits are read from the repository's own copies.** ADR-0004
needs ADR-0003's root; ADR-0005 needs both. The check reads them from
`docs/adr/<alias>/` and fails, naming the ADR, when one is not `accepted`.
Alternative: duplicating the root and levels in ADR-0005's traits. Rejected:
two places to keep in step, nothing comparing them.

**6. The gate keys on two declared lines, `PRD:` and `Probe:`, at line
start in the proposal.** Plain text, so it survives any OpenSpec template and
any agent. Matching links or paths anywhere in the prose was rejected: it
would make the check parse prose, which the decisions exclude. A proposal
with no `PRD:` line passes: it claims no product basis, and review sees that.

**7. ADR-0001 ships `accepted`**, as engineering's does: it is the mechanics
the other four are ruled with. The other four ship `proposed`. Its check runs
mdschema on ruled copies, as engineering's does, with no trait to rule.

**8. Trait names all sit under `product.`** (`product.toolkit`,
`product.artifacts.root`, `product.evidence.levels`,
`product.evidence.required`, `product.handoff`), so they never collide with
another track's traits in an agent's view of the repository.

## Risks / Trade-offs

- [pm-skills changes its frontmatter and drops `artifact:`] → ADR-0002's
  check fails loudly on every artifact; the fix is a check update and, if the
  convention moves, a revision.
- [Teams add `Probe:` lines to get past the gate] → stated in ADR-0005 as a
  known cost: the check sees presence only, review judges the probe.
- [`evidence:` is self-declared, so a PRD can claim `observed` with nothing
  behind it] → accepted for revision 1; ADR-0004 says how a level is raised is
  deferred, and that revision will tighten it.
- [ADR-0003's check scans every tracked Markdown file for `artifact:`] →
  cost grows with repository size; frontmatter only, so it stays cheap.

## Migration Plan

Greenfield: nothing to migrate. Release 0.1.0 through release-please once the
tasks are done; rollback is `npm deprecate` of the version.

## Open Questions

- Whether `none` should also be an allowed value for `product.artifacts.root`
  (no product artifacts kept in the repository). Today the answer is
  `rejected` on ADR-0003; adding `none` later is a revision.
