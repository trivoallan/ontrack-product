# ontrack-product

Product-management conventions your repositories import as ADRs, with
[ontrack](https://github.com/trivoallan/ontrack): which toolkit writes
product artifacts, where they live, what evidence they claim, and when an
engineering change may build on them. Each convention comes with a check
that `ontrack check` runs once you accept it.

This track needs no other track installed. It proposes the alias `product`.

## Install

```bash
npm i -D @trivoallan/ontrack
npm i -D product@npm:@trivoallan/ontrack-product
npx ontrack plan
npx ontrack apply
```

The ADRs land in `docs/adr/product/`, `proposed`, with empty traits. Rule on
each one in its own file: the file says how.

## The conventions

5 decisions, on these subjects:

| ADR | Subject | Recommends |
| --- | --- | --- |
| [ADR-0001](adr/ADR-0001-record-product-decisions.md) | how these ADRs are written and ruled on | ships `accepted` |
| [ADR-0002](adr/ADR-0002-toolkit.md) | the toolkit agents write product artifacts with | `product.toolkit: pm-skills` |
| [ADR-0003](adr/ADR-0003-location.md) | where product artifacts live | `product.artifacts.root: research/` |
| [ADR-0004](adr/ADR-0004-evidence.md) | the `evidence:` level every artifact declares | `[hypothesis, observed, validated]`, `observed` required |
| [ADR-0005](adr/ADR-0005-handoff.md) | when an OpenSpec change may build on a PRD | `product.handoff: openspec` |

## Checks

All 5 of them come with a check: a `check:` line in the frontmatter,
`npx --no-install ontrack-product-check ADR-000n`. Once your repository
accepts an ADR, `ontrack check` runs that command from your repository's
root. It runs this package's code there: read it as you would an install
script. It reads frontmatter keys (`status:`, the traits, `artifact:`,
`evidence:`) and the `PRD:` and `Probe:` lines of OpenSpec proposals, never
the prose of an artifact, and it changes no file.

## Develop

```bash
npm install
npm test
```

Changes to this repository are planned with OpenSpec, in `openspec/`.

## License

[MIT-0](LICENSE).
