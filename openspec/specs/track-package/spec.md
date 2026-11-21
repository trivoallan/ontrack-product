# track-package Specification

## Purpose
Defines the npm package that carries the product track, so that ontrack can
find its ADRs, a repository can install it under the `product` alias, and its
check command runs without fetching anything.

## Requirements

### Requirement: ontrack manifest keys
The package SHALL be published as `@trivoallan/ontrack-product`. Its
`package.json` SHALL carry `"ontrack": { "adr": "adr", "namespace": "product" }`
and list `ontrack-tracks` among its `keywords`.

#### Scenario: ontrack reads the track
- **WHEN** a repository installs the package with `npm i -D product@npm:@trivoallan/ontrack-product` and runs `npx ontrack plan`
- **THEN** the plan lists every ADR of `adr/` as `new` under `product`

#### Scenario: Discoverable on the registry
- **WHEN** `package.json` is read
- **THEN** `keywords` contains `ontrack-tracks`

### Requirement: Shipped files
The published tarball SHALL contain `adr/` (the ADRs and their
`.mdschema.yml`) and the built check, `dist/ontrack-product-check.js`, and
nothing from `checks/`, `openspec/` or the tests.

#### Scenario: Tarball contents
- **WHEN** `npm pack --dry-run` runs
- **THEN** it lists the files under `adr/`, `dist/ontrack-product-check.js`, `package.json`, `README.md` and `LICENSE`, and no `.ts` file

### Requirement: Check command as a bin
The package SHALL expose a `bin` named `ontrack-product-check` that points at
`dist/ontrack-product-check.js`, built from `checks/ontrack-product-check.ts`
when the package is prepared.

#### Scenario: Runs without fetching
- **WHEN** a repository that installed the package runs `npx --no-install ontrack-product-check ADR-0003`
- **THEN** the command runs from `node_modules/.bin` and nothing is fetched from a registry

### Requirement: License and engines
The package SHALL be licensed MIT-0, with a `LICENSE` file holding that text,
and SHALL declare `"engines": { "node": ">=22.18" }`.

#### Scenario: License declared
- **WHEN** `package.json` is read
- **THEN** `license` is `MIT-0` and `engines.node` is `>=22.18`

### Requirement: Release with release-please
Versions SHALL be cut by release-please from Conventional Commits on `main`,
release type `node`, minor bumps while below 1.0, and the first release SHALL
be `0.1.0`.

#### Scenario: First release
- **WHEN** the first release pull request is opened by release-please
- **THEN** it sets `version` to `0.1.0` in `package.json` and `.release-please-manifest.json`

### Requirement: README says what the track proposes
The README SHALL state how many conventions the track ships and on which
subjects, which of them carry a `check` command, and the alias it proposes,
`product`. It SHALL say that the track needs no other track installed.

#### Scenario: README lists the ADRs
- **WHEN** the README is read
- **THEN** it names ADR-0001 to ADR-0005, says each carries a `check:` line, and gives the install command with the `product` alias
