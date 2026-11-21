# Proposal

## Why

Product work done with coding agents produces artifacts (PRDs, problem
statements, hypotheses) that land anywhere in a repository, carry no
statement of how well they are supported, and flow into engineering changes
whether or not anyone checked them against users. ontrack already lets a
repository import conventions as ADRs and rule on them; there is no track
for product management. This change ships v0.1 of one, `ontrack-product`,
so a repository can rule on where product artifacts live, what evidence
they claim, and when a change may build on them.

## What Changes

- A new npm package, `@trivoallan/ontrack-product`, laid out like
  `trivoallan/ontrack-engineering`: `package.json` with
  `"ontrack": { "adr": "adr", "namespace": "product" }` and the keyword
  `ontrack-tracks`, license MIT-0, Node `>=22.18`, release-please.
- Five ADRs in `adr/`, Nygard sections, English, `revision: 1`:
  - **ADR-0001 Record product decisions**: the mechanics (proposed,
    revision, rejected, how to rule, the `check:` line). Standalone: it
    does not require the engineering track.
  - **ADR-0002 Product toolkit**: trait `product.toolkit`, recommends
    `pm-skills` (product-on-purpose), `nanopm` as the alternative.
  - **ADR-0003 Location**: trait `product.artifacts.root`, recommends
    `research/`.
  - **ADR-0004 Evidence**: adds an `evidence:` frontmatter field to every
    product artifact; traits `product.evidence.levels` (recommends
    `[hypothesis, observed, validated]`) and `product.evidence.required`
    (recommends `observed`). How a level is raised is deferred.
  - **ADR-0005 Handoff**: trait `product.handoff`, recommends `openspec`;
    a change whose proposal cites a PRD below the required level fails
    unless it declares a `Probe:` line.
- A check command, `ontrack-product-check <ADR number>`, written in
  `checks/ontrack-product-check.ts`, built to `dist/`, exposed as a `bin`,
  and named by every ADR's `check:` line as
  `npx --no-install ontrack-product-check ADR-000n`. It reads frontmatter
  and declared lines only, never the prose of a PRD.
- An `.mdschema.yml` next to the ADRs that refuses a half-ruled ADR, run by
  the ADR-0001 check.

## Capabilities

### New Capabilities

- `track-package`: the npm package itself: manifest keys ontrack reads,
  shipped files, `bin`, license, engines, release.
- `adr-format`: the shape every shipped ADR follows (naming, frontmatter,
  sections, proposed state, how-to-rule block, revisions) and the schema
  that refuses a half-ruled copy.
- `adr-catalog`: the five ADRs of v0.1, their traits, allowed values and
  recommended values.
- `adr-checks`: the `ontrack-product-check` command and what it checks for
  each ADR once ruled.

### Modified Capabilities

None: the repository has no specs yet.

## Impact

- New repository content: `package.json`, `package-lock.json`,
  `tsconfig.json`, `adr/`, `checks/`, `README.md`, `LICENSE`,
  `release-please-config.json`, `.release-please-manifest.json`, CI and
  release workflows.
- Runtime dependency of the check: `@jackchuka/mdschema` (ADR schema), as
  in ontrack-engineering. Traits are validated by hand, without `zod`: five
  keys do not need a schema library.
- A repository that installs the track and accepts ADR-0004 must add
  `evidence:` to every product artifact under its root; one that accepts
  ADR-0005 sees `ontrack check` fail on OpenSpec changes that build on an
  unsupported PRD without a probe.
- No content is copied from deanpeters/Product-Manager-Skills (CC BY-NC-SA).
