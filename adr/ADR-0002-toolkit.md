---
adr: ADR-0002
slug: toolkit
title: Product toolkit
status: proposed
revision: 1
date:
authors: []
supersedes: []
check: npx --no-install ontrack-product-check ADR-0002
traits:
  product:
    toolkit:
---

# Product toolkit

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

Coding agents write product artifacts when asked: a PRD, a problem
statement, a hypothesis, a launch checklist. Without a shared toolkit, each
session improvises the structure, and two PRDs in the same repository share
nothing a person or a script can rely on.

A product toolkit is a set of skills an agent runs to produce those
artifacts from templates. What matters to this track is not the prose the
templates suggest but what they write in a form a tool can read: the rest
of ontrack-product's conventions (ADR-0003 to ADR-0005) check frontmatter,
never prose.

## Decision

**What ontrack-product recommends, and why.**

| Key | Recommended value | Reason |
| --- | --- | --- |
| `product.toolkit` | `pm-skills` | the [pm-skills](https://github.com/product-on-purpose/pm-skills) Claude Code plugin, by product-on-purpose. Its templates open every artifact with YAML frontmatter (`artifact:`, `version:`, `created:`, `status:`), so the kind of an artifact is a key, not a guess from its title. It covers discovery to delivery (problem statements, hypotheses, PRDs, experiment designs) and leaves the output path to you, which ADR-0003 fixes |

With `pm-skills`, every product artifact carries a non-empty `artifact:`
key in its frontmatter. An artifact written by hand follows the same rule:
it says what kind of artifact it is.

Everything below disappears when you rule, from this sentence up to the
Consequences heading, which stays.

**How to rule: five steps, all in this file.** Read all of them before
doing any, because the last one deletes the other four, and do them in one
commit.

1. **Write the value of `product.toolkit`** under `traits:` in the
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
check: npx --no-install ontrack-product-check ADR-0002
traits:
  product:
    toolkit: pm-skills
```

**The `check:` line stays.** Once this ADR is `accepted`, it reads
`product.toolkit` and, from ADR-0003, `product.artifacts.root`. With
`pm-skills`, it fails on every product artifact (a Markdown file tracked by
git under the root) whose frontmatter has no non-empty `artifact:` key. It
reads that key and nothing else. With `nanopm` or `none`, it has nothing to
check, and passes.

The Alternatives Considered below were weighed without knowing your
context. Weighing them against yours is still to do.

## Consequences

### Positive

- Product artifacts share a structure, and their kind is a key a tool reads.
- The other conventions of this track have something to check.

### Negative

- The repository depends on a third-party plugin and its template choices.
  If pm-skills changes its frontmatter, the check fails until it is updated.
- People who write artifacts by hand must add the frontmatter themselves.

### Neutral

- The toolkit is chosen per repository; the agent that runs it is not
  decided here.

## Alternatives Considered

### `pm-skills`

Recommended, as above.

### `nanopm`

A PM pipeline for coding agents (feedback, personas, objectives, strategy,
roadmap, PRD) that keeps its output in a wiki under `.nanopm/wiki/`, each
step reading the previous one. Strong at chaining a planning cycle; its
pages are not typed by an `artifact:` key, so the check has nothing to read
and passes. Choose it when the planning cycle matters more than checked
artifacts; ADR-0003 then names `.nanopm/wiki/` or another root.

### `none`

No toolkit: artifacts are written by hand or by an agent without
templates. The check passes. Say why the repository can do without.

## References

- [pm-skills](https://github.com/product-on-purpose/pm-skills): the recommended toolkit.
- [nanopm](https://github.com/nmrtn/nanopm): the alternative.
- [ADR-0003](ADR-0003-location.md): where the artifacts live, which this check reads.

**The keys.**

| Key | What it holds | Allowed values |
| --- | --- | --- |
| `product.toolkit` | the toolkit agents use to write product artifacts here | `pm-skills`, `nanopm`, `none` |

**The key is required**: an empty key is not a value. The check needs
ADR-0003 accepted when the value is `pm-skills`.
