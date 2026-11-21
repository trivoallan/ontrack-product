# adr-catalog Specification

## Purpose
Defines the five conventions ontrack-product v0.1 ships, the trait keys each
one asks a repository to rule on, their allowed values and the values the
track recommends.

## Requirements

### Requirement: Catalog of v0.1
`adr/` SHALL hold exactly these ADRs: `ADR-0001-record-product-decisions`,
`ADR-0002-toolkit`, `ADR-0003-location`, `ADR-0004-evidence` and
`ADR-0005-handoff`.

#### Scenario: Listed by ontrack
- **WHEN** a repository runs `npx ontrack plan` after installing the track
- **THEN** it lists those five ADRs as `new` under `product`

### Requirement: ADR-0002 Product toolkit
ADR-0002 SHALL carry one trait, `product.toolkit`, with allowed values
`pm-skills`, `nanopm` and `none`, and SHALL recommend `pm-skills`, the
product-on-purpose Claude Code plugin, because its templates write YAML
frontmatter (`artifact:`, `version:`, `created:`, `status:`) that a check can
read without parsing prose. It SHALL present `nanopm` as the alternative and
say what it does differently. It SHALL NOT reproduce content from
deanpeters/Product-Manager-Skills.

#### Scenario: Recommendation
- **WHEN** ADR-0002's Decision section is read
- **THEN** it recommends `product.toolkit: pm-skills`, gives the frontmatter reason, and names `nanopm` among the alternatives

### Requirement: ADR-0003 Location
ADR-0003 SHALL carry one trait, `product.artifacts.root`, holding a directory
relative to the repository root, and SHALL recommend `research/`, because
pm-skills fixes no output path and product artifacts scattered across the
repository cannot be found or checked. It SHALL say that every product
artifact lives under that directory, at any depth.

#### Scenario: Recommendation
- **WHEN** ADR-0003's Decision section is read
- **THEN** it recommends `product.artifacts.root: research/` and says pm-skills fixes no path

### Requirement: ADR-0004 Evidence
ADR-0004 SHALL add a frontmatter field, `evidence:`, to every product
artifact under `product.artifacts.root`, and say that pm-skills does not write
it. It SHALL carry two traits: `product.evidence.levels`, an ordered list from
weakest to strongest, recommended `[hypothesis, observed, validated]`; and
`product.evidence.required`, one of those levels, recommended `observed`. It
SHALL define each recommended level in one sentence. It SHALL say that how an
artifact's level is raised, and what proves it, is not decided in revision 1
and will be in a later revision.

#### Scenario: Recommendation
- **WHEN** ADR-0004's Decision section is read
- **THEN** it recommends the three levels in that order and `observed` as required, and states that raising a level is deferred

#### Scenario: Required level is a level
- **WHEN** ADR-0004's keys table is read
- **THEN** it says `product.evidence.required` must be one of `product.evidence.levels`

### Requirement: ADR-0005 Handoff
ADR-0005 SHALL carry one trait, `product.handoff`, with allowed values
`openspec` and `none`, and SHALL recommend `openspec`. It SHALL state in prose
that with `openspec` it assumes engineering work is planned as OpenSpec
changes under `openspec/changes/`. It SHALL state that the gate blocks the
change, not the PRD: a PRD below the required level may exist and be worked
on; an OpenSpec change whose proposal cites it with a `PRD:` line is refused,
unless the proposal carries a `Probe:` line that names the hypothesis the
change tests and what will be observed. It SHALL say that the check only sees
that the `Probe:` line is there, and that review judges whether the probe is
real.

#### Scenario: Recommendation
- **WHEN** ADR-0005's Decision section is read
- **THEN** it recommends `product.handoff: openspec`, states the OpenSpec assumption, and describes the `PRD:` and `Probe:` lines

### Requirement: Checks read declared data only
Each convention SHALL state, next to its `check:` line, exactly what its check
reads: frontmatter keys (`artifact:`, `evidence:`) and the declared `PRD:` and
`Probe:` lines. None SHALL ask its check to read the prose of a PRD.

#### Scenario: Stated scope
- **WHEN** the section of ADR-0005 that describes its check is read
- **THEN** it lists the proposal's `PRD:` and `Probe:` lines and the cited file's `evidence:` key as everything the check reads
