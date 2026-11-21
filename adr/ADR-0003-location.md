---
adr: ADR-0003
slug: location
title: Location
status: proposed
revision: 1
date:
authors: []
supersedes: []
check: npx --no-install ontrack-product-check ADR-0003
traits:
  product:
    artifacts:
      root:
---

# Location

## Status

Proposed

> **What is this file?** A convention ontrack-product proposes to your
> repository, with the values it recommends. While it says
> `status: proposed`, you may edit it freely. `revision:` dates the
> convention, not the file: you do not fill it. `rejected` is a full ruling:
> when the convention does not apply here, rule `rejected`, remove the whole
> `traits:` block, and say what stands in for it.
> [ADR-0001](ADR-0001-record-product-decisions.md) explains the mechanics.

## Context

An agent asked for a PRD writes it where the conversation suggests: the
repository root, `docs/`, a feature folder, a scratch directory. Six months
later nobody can say which PRDs exist, and a tool that should check them
has nowhere to look.

pm-skills, the toolkit [ADR-0002](ADR-0002-toolkit.md) recommends, fixes no
output path: it writes where it is told. Something has to tell it.

## Decision

**What ontrack-product recommends, and why.**

| Key | Recommended value | Reason |
| --- | --- | --- |
| `product.artifacts.root` | `research/` | one directory, at the top of the repository, named for what it holds before anything is built. It sits apart from `docs/`, which describes what exists, and from `openspec/`, which plans what will be built. Any depth below it is yours: `research/search/prd.md` is as valid as `research/prd-search.md` |

**Every product artifact lives under the root.** A product artifact is a
Markdown file tracked by git that says, in an `artifact:` frontmatter key,
what kind of product artifact it is. Anything under the root counts as a
product artifact for the checks of ADR-0002 and ADR-0004; anything with an
`artifact:` key outside it is in the wrong place.

The value is a directory relative to the repository root. It may not be
absolute, nor leave the repository.

Everything below disappears when you rule, from this sentence up to the
Consequences heading, which stays.

**How to rule: five steps, all in this file.** Read all of them before
doing any, because the last one deletes the other four, and do them in one
commit.

1. **Write the value of `product.artifacts.root`** under `traits:` in the
   frontmatter, or, if you rule `rejected`, **remove the whole `traits:`
   block**.
2. **Change `status:`** from `proposed` to `accepted` or `rejected`.
3. **Fill `date:` and `authors:`**: `date:` as `YYYY-MM-DD`, the day you
   rule; `authors:`, the names of the people who decided, without email
   addresses.
4. **Rewrite the Positive, Negative and Neutral lists under Consequences**
   for your ruling.
5. **Last, delete this block**, from its first sentence up to the
   Consequences heading, which stays. In its place, write the reason for
   your decision wherever you depart from the recommendation, or one line
   that says you adopt it.

Once filled, the frontmatter reads:

```yaml
status: accepted
date: 2026-11-21
authors: [Your Name]
check: npx --no-install ontrack-product-check ADR-0003
traits:
  product:
    artifacts:
      root: research/
```

**The `check:` line stays.** Once this ADR is `accepted`, it fails when the
root is absolute or leaves the repository, when it is not a directory of the
repository, or when a Markdown file tracked by git outside the root has a
non-empty `artifact:` frontmatter key. It reads that key and nothing else.

## Consequences

### Positive

- Every product artifact is found in one place, by people, agents and
  checks.
- An artifact written in the wrong place fails before review.

### Negative

- An artifact that belongs next to the code it describes has to live
  elsewhere, and be linked.
- The directory must exist before the check passes, even before the first
  artifact: keep a `.gitkeep` in it.

### Neutral

- The name is a convention, not a meaning: `product/` or `discovery/`
  work as well.

## Alternatives Considered

### `research/`

Recommended, as above.

### `docs/product/`

Keeps every document under `docs/`. It mixes what is described with what
is still a claim, and a documentation site built from `docs/` publishes
hypotheses next to reference pages.

### `.nanopm/wiki/`

The directory nanopm writes to, when [ADR-0002](ADR-0002-toolkit.md) rules
`nanopm`. Hidden, and owned by the tool rather than the team.

### No fixed place

Each artifact goes where it is needed. Nothing can find them all, and the
evidence convention of ADR-0004 has nothing to check.

## References

- [ADR-0002](ADR-0002-toolkit.md): the toolkit that writes the artifacts.
- [ADR-0004](ADR-0004-evidence.md): what every artifact under the root
  declares.

**The keys.**

| Key | What it holds | Allowed values |
| --- | --- | --- |
| `product.artifacts.root` | the directory every product artifact lives under | a directory relative to the repository root |

**The key is required**: an empty key is not a value. ADR-0002, ADR-0004 and
ADR-0005 read it from this file, and fail until this ADR is accepted.
