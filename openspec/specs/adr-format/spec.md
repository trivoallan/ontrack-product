# adr-format Specification

## Purpose
Defines the shape every ADR shipped by ontrack-product follows, so that a
consuming repository can rule on it, ontrack can compare its revision, and a
half-ruled copy is refused.

## Requirements

### Requirement: File naming and numbering
Every ADR SHALL live in `adr/` as `ADR-NNNN-slug.md`, where `NNNN` is a
four-digit number and `slug` is the kebab-case value of its `slug:` key.
Numbers SHALL form a gapless sequence starting at `0001`, and a shipped
number SHALL NOT be reused or renumbered.

#### Scenario: Name matches frontmatter
- **WHEN** `adr/ADR-0004-evidence.md` is read
- **THEN** its frontmatter has `adr: ADR-0004` and `slug: evidence`

#### Scenario: No gap
- **WHEN** the files in `adr/` are listed by number
- **THEN** every number from `0001` to the highest present appears exactly once

### Requirement: Frontmatter keys
Every ADR SHALL carry the keys `adr`, `slug`, `title`, `status`, `revision`,
`date`, `authors`, `supersedes` and `check`. A convention SHALL also carry a
`traits:` block whose keys all sit under `product`. `revision` SHALL be a
positive integer, `1` for every ADR in v0.1. `check` SHALL be
`npx --no-install ontrack-product-check <adr>`, with the ADR's own number.

#### Scenario: Complete frontmatter
- **WHEN** the frontmatter of any shipped ADR is parsed
- **THEN** all nine keys are present, `revision` is `1`, and `check` names that ADR's number

### Requirement: Nygard sections in English
Every ADR body SHALL be written in English and SHALL contain, in this order,
`## Status`, `## Context`, `## Decision`, `## Consequences` (with
`### Positive`, `### Negative` and `### Neutral`), `## Alternatives Considered`
and `## References`.

#### Scenario: Section order
- **WHEN** the headings of a shipped ADR are listed
- **THEN** they contain those sections in that order

### Requirement: Conventions ship proposed and empty
Every ADR except ADR-0001 SHALL ship with `status: proposed`, an empty
`date:`, `authors: []`, and every trait key present with no value. Its
Decision section SHALL state the recommended value of each key and why, then
a how-to-rule block, opened by a fixed marker sentence and closed before
`## Consequences`, that lists the steps to rule and shows the filled
frontmatter. The References section SHALL end with a table of the keys, what
each holds, and its allowed values.

#### Scenario: Shipped convention
- **WHEN** `adr/ADR-0005-handoff.md` is read as shipped
- **THEN** `status` is `proposed`, `product.handoff` has no value, and the Decision section recommends `openspec` and holds the how-to-rule block

### Requirement: ADR-0001 ships accepted
ADR-0001 SHALL ship with `status: accepted`, because it states the mechanics
the repository rules the others with rather than a convention to rule on. It
SHALL say so at the top of its Status section, and say that it can be
superseded like any ADR.

#### Scenario: Mechanics ADR
- **WHEN** `adr/ADR-0001-record-product-decisions.md` is read
- **THEN** `status` is `accepted` and its Status section says why it is not proposed

### Requirement: Standalone mechanics
ADR-0001 SHALL describe, without referring to any other track: what
`proposed`, `accepted` and `rejected` mean; that `revision` dates the
convention and moves only when a trait, an allowed value or a recommended
value changes; that a ruled body freezes and reopening takes a new ADR; that a
`rejected` ruling removes the whole `traits:` block and says what stands in;
what a `check:` line runs and when; and that the repository's own decisions
live in `docs/adr/local/`, with their own numbering.

#### Scenario: No dependency on another track
- **WHEN** ADR-0001 is read
- **THEN** it explains every rule above and links to no ADR of another track as a prerequisite

### Requirement: Schema refuses a half-ruled ADR
`adr/.mdschema.yml`, together with the ADR-0001 check for `authors` (which
mdschema cannot require to be non-empty), SHALL refuse an ADR whose `status`
is not `proposed` when any of these holds: `date` is empty, `authors` is empty, a trait key is empty
(unless the ruling is `rejected` and the `traits:` block is gone), a required
section is missing, or the how-to-rule block's marker sentence is still
present.

#### Scenario: Forgotten trait
- **WHEN** a copy of ADR-0003 says `status: accepted` and `product.artifacts.root` is empty
- **THEN** mdschema run with `adr/.mdschema.yml` fails and names the file and the key

#### Scenario: Forgotten block
- **WHEN** a copy of ADR-0004 is `accepted` with every key filled but still holds the how-to-rule marker sentence
- **THEN** mdschema fails on that file

#### Scenario: Shipped ADRs are not checked
- **WHEN** mdschema runs on the ADRs as shipped
- **THEN** ADR-0002 to ADR-0005 are skipped because they are `proposed`, and ADR-0001 passes
