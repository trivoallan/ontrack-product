# Spec Delta

## Purpose

Defines `ontrack-product-check`, the command each ontrack-product ADR's
`check:` line calls, so that `ontrack check` tells a consuming repository when
its product artifacts or its changes depart from a convention it ruled.

## ADDED Requirements

### Requirement: The ontrack-product-check command
The package SHALL expose `ontrack-product-check`, taking one argument, an ADR
number such as `ADR-0004`. It SHALL run from the consuming repository's root
and read that repository's copy of the ADR: the single file matching
`docs/adr/<alias>/<number>-*.md`, where `<alias>` is the directory the package
is installed under in `node_modules/`, or any directory of `docs/adr/` except
`local` when the alias cannot be read. It SHALL exit `0` when the repository
conforms and non-zero otherwise, naming on its output each file and key at
fault. It MUST NOT create, modify or delete any file in the repository.

#### Scenario: ADR found
- **WHEN** `ontrack-product-check ADR-0003` runs in a repository holding `docs/adr/product/ADR-0003-location.md`
- **THEN** it reads the traits of that file

#### Scenario: ADR missing
- **WHEN** no file matches `docs/adr/product/ADR-0003-*.md`
- **THEN** it exits non-zero and standard error names the pattern it looked for

#### Scenario: Unknown ADR
- **WHEN** `ontrack-product-check ADR-0009` runs
- **THEN** it exits non-zero and standard error says this package ships no check for ADR-0009

#### Scenario: Usage
- **WHEN** it runs with no argument
- **THEN** it exits non-zero and standard error starts with `usage: ontrack-product-check <ADR number>`

#### Scenario: Repository left untouched
- **WHEN** any check has run, whatever its result
- **THEN** `git status --porcelain` prints the same as before

### Requirement: Unruled or missing traits
When a trait the check needs is absent or empty in the ADR it reads, the
check SHALL exit non-zero and say that the ADR is not ruled. When it needs a
trait from another ADR of the track (ADR-0003's root, ADR-0004's levels) and
that ADR is not `accepted`, it SHALL exit non-zero and name the ADR that must
be accepted first.

#### Scenario: Empty key
- **WHEN** `ontrack-product-check ADR-0004` reads a copy where `product.evidence.required` is empty
- **THEN** it exits non-zero and says ADR-0004 is not ruled

#### Scenario: Dependency not accepted
- **WHEN** ADR-0004 is `accepted` and ADR-0003 is `proposed`
- **THEN** `ontrack-product-check ADR-0004` exits non-zero and says ADR-0003 must be accepted first

### Requirement: Product artifacts
A product artifact SHALL mean a Markdown file tracked by git under
`product.artifacts.root`, at any depth. The checks SHALL read only its YAML
frontmatter, never its body.

#### Scenario: Body ignored
- **WHEN** a PRD under `research/` says "validated" in its prose and `evidence: hypothesis` in its frontmatter
- **THEN** every check treats it as `hypothesis`

### Requirement: ADR-0001 check
`ontrack-product-check ADR-0001` SHALL run the mdschema this package depends
on, with the package's `adr/.mdschema.yml`, on every copy in the same
directory as the repository's ADR-0001 whose status is not `proposed`, and
exit with mdschema's result. With no such copy, it SHALL print that nothing is
ruled yet and exit `0`.

#### Scenario: Half-ruled copy
- **WHEN** the repository's ADR-0002 copy is `accepted` with `product.toolkit` empty
- **THEN** the ADR-0001 check exits non-zero and names that file

### Requirement: ADR-0002 check
With `product.toolkit: pm-skills`, `ontrack-product-check ADR-0002` SHALL fail
on every product artifact whose frontmatter has no non-empty `artifact:` key.
With `nanopm` or `none`, it SHALL print one line saying there is nothing to
check and why, and exit `0`.

#### Scenario: Artifact without type
- **WHEN** `product.toolkit` is `pm-skills` and `research/notes.md` has no `artifact:` key
- **THEN** the check exits non-zero and names `research/notes.md`

#### Scenario: Other toolkit
- **WHEN** `product.toolkit` is `nanopm`
- **THEN** the check prints that there is nothing to check and exits `0`

### Requirement: ADR-0003 check
`ontrack-product-check ADR-0003` SHALL fail when `product.artifacts.root` is
absolute or leaves the repository, when it is not a directory of the
repository, or when a Markdown file tracked by git outside it has a non-empty
`artifact:` frontmatter key.

#### Scenario: Artifact outside the root
- **WHEN** the root is `research/` and `docs/prd-search.md` has `artifact: prd`
- **THEN** the check exits non-zero and names `docs/prd-search.md`

#### Scenario: Root missing
- **WHEN** the root is `research/` and the repository has no `research/` directory
- **THEN** the check exits non-zero and says the directory does not exist

### Requirement: ADR-0004 check
`ontrack-product-check ADR-0004` SHALL fail when `product.evidence.levels` is
empty or repeats a value, when `product.evidence.required` is not one of the
levels, and on every product artifact whose frontmatter has no `evidence:` key
or an `evidence:` value outside the levels. It SHALL NOT judge whether a level
is deserved.

#### Scenario: Missing evidence
- **WHEN** `research/prd-search.md` has no `evidence:` key
- **THEN** the check exits non-zero and names the file

#### Scenario: Unknown level
- **WHEN** an artifact says `evidence: proven` and the levels are `[hypothesis, observed, validated]`
- **THEN** the check exits non-zero and names the file and the allowed levels

#### Scenario: Hypothesis allowed to exist
- **WHEN** every artifact has `evidence: hypothesis` and the required level is `observed`
- **THEN** the check exits `0`

### Requirement: ADR-0005 check
With `product.handoff: openspec`, `ontrack-product-check ADR-0005` SHALL read
the `proposal.md` of every directory under `openspec/changes/`, `archive/`
excluded. For each line of a proposal that starts with `PRD:` followed by a
path relative to the repository root, it SHALL fail when the path is not a
product artifact, or when that artifact's `evidence:` ranks below
`product.evidence.required` in `product.evidence.levels` and the proposal has
no line that starts with `Probe:` followed by non-empty text. A proposal with
no `PRD:` line SHALL pass. With `none`, it SHALL print that there is nothing
to check and exit `0`. It needs ADR-0003 and ADR-0004 accepted.

#### Scenario: Change on an unsupported PRD
- **WHEN** `openspec/changes/add-search/proposal.md` holds `PRD: research/prd-search.md`, that PRD says `evidence: hypothesis`, the required level is `observed`, and the proposal has no `Probe:` line
- **THEN** the check exits non-zero and names the change and the PRD with its level

#### Scenario: Probe declared
- **WHEN** the same proposal also holds `Probe: users who search twice abandon less; observed in the funnel for two weeks`
- **THEN** the check passes that change

#### Scenario: Supported PRD
- **WHEN** the cited PRD says `evidence: observed` and the required level is `observed`
- **THEN** the check passes that change

#### Scenario: Cited file not a product artifact
- **WHEN** a proposal holds `PRD: docs/old-prd.md` and the root is `research/`
- **THEN** the check exits non-zero and says the path is not under the root

#### Scenario: Archived change ignored
- **WHEN** only `openspec/changes/archive/2026-01-01-x/proposal.md` cites a hypothesis PRD without a probe
- **THEN** the check exits `0`
