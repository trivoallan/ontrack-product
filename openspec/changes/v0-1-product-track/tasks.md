# Tasks

## 1. Package skeleton

- [x] 1.1 Write `package.json` (`@trivoallan/ontrack-product`, `ontrack` key, `ontrack-tracks` keyword, MIT-0, `engines.node >=22.18`, `files`, `bin`, `build`/`prepare`/`test` scripts, `@jackchuka/mdschema` dependency) and verify `npm install` succeeds
- [x] 1.2 Add `tsconfig.json` building `checks/ontrack-product-check.ts` to `dist/` and verify `npm run build` writes `dist/ontrack-product-check.js`
- [x] 1.3 Add `LICENSE` with the MIT-0 text and `.gitignore` (`node_modules/`, `dist/`) and verify `npm pack --dry-run` lists only the files of the track-package spec

## 2. ADRs

- [x] 2.1 Write `adr/ADR-0001-record-product-decisions.md` (accepted, standalone mechanics) and verify it holds every rule of the adr-format "Standalone mechanics" requirement
- [x] 2.2 Write `adr/ADR-0002-toolkit.md` (`product.toolkit`, recommend `pm-skills`, `nanopm` alternative, no deanpeters content) and verify its frontmatter matches the adr-format spec
- [x] 2.3 Write `adr/ADR-0003-location.md` (`product.artifacts.root`, recommend `research/`) and verify its frontmatter matches the adr-format spec
- [x] 2.4 Write `adr/ADR-0004-evidence.md` (`evidence:` field, `levels` and `required`, raising deferred) and verify its frontmatter matches the adr-format spec
- [x] 2.5 Write `adr/ADR-0005-handoff.md` (`product.handoff`, recommend `openspec`, `PRD:` / `Probe:` gate on the change) and verify its frontmatter matches the adr-format spec
- [x] 2.6 Write `adr/.mdschema.yml` and verify mdschema skips the four proposed ADRs and passes ADR-0001

## 3. Check command

- [x] 3.1 Write the command entry (argument parsing, usage, ADR lookup by alias, unknown ADR, trait reading, cross-ADR reading) with tests for each scenario of "The ontrack-product-check command" and "Unruled or missing traits"
- [x] 3.2 Implement the ADR-0001 check (mdschema on ruled copies) and verify its scenarios with a test fixture repository
- [x] 3.3 Implement the ADR-0002 check and verify its scenarios with tests
- [x] 3.4 Implement the ADR-0003 check and verify its scenarios with tests
- [x] 3.5 Implement the ADR-0004 check and verify its scenarios with tests
- [x] 3.6 Implement the ADR-0005 check and verify its scenarios with tests, archive exclusion included
- [x] 3.7 Add a test that every shipped ADR's `check:` line names its own number and that a run leaves `git status --porcelain` unchanged, and verify `npm test` passes with 90 % line coverage

## 4. Documentation and release

- [x] 4.1 Write `README.md` (five conventions, their `check:` lines, `npm i -D product@npm:@trivoallan/ontrack-product`, standalone) and verify it meets the track-package README requirement
- [x] 4.2 Add `release-please-config.json`, `.release-please-manifest.json` (`0.0.0`) and the release workflow, and verify the config validates against release-please's schema
- [ ] 4.3 Add the CI workflow running `npm ci` and `npm test` on pull requests, and verify it passes on the change's pull request

## 5. End to end

- [x] 5.1 Install the track with `file:` in a scratch repository, run `npx ontrack plan` and `npx ontrack apply`, rule the five ADRs, and verify `npx ontrack check` passes, then fails after removing an `evidence:` key
- [ ] 5.2 Run `openspec validate --all` and `openspec archive v0-1-product-track` in the pull request that checks the last task, and verify `openspec/specs/` holds the four capabilities
