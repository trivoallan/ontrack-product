---
adr: ADR-0004
slug: evidence
title: Evidence
status: proposed
revision: 1
date:
authors: []
supersedes: []
check: npx --no-install ontrack-product-check ADR-0004
traits:
  product:
    evidence:
      levels:
      required:
---

# Evidence

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

A PRD written by an agent reads the same whether it rests on twenty user
interviews or on one sentence typed in a chat. Its structure is complete,
its tone is confident, and nothing in it says how much of it is known. The
next agent, asked to build it, takes it at its word.

pm-skills' templates record the kind of an artifact, its version, its
creation date and its draft status. None of them records how well the
artifact is supported.

## Decision

**ontrack-product adds one frontmatter field, `evidence:`, to every product
artifact** under the root [ADR-0003](ADR-0003-location.md) fixes. pm-skills
does not write it: add it when the artifact is created, next to `artifact:`.

```yaml
---
artifact: prd
version: "1.0"
created: 2026-11-21
status: draft
evidence: hypothesis
---
```

**What ontrack-product recommends, and why.**

| Key | Recommended value | Reason |
| --- | --- | --- |
| `product.evidence.levels` | `[hypothesis, observed, validated]` | three levels, weakest first, each one a different kind of claim. Fewer cannot tell a guess from a seen behaviour; more invites arguing about the level instead of looking at users |
| `product.evidence.required` | `observed` | the level an artifact must reach before engineering builds on it ([ADR-0005](ADR-0005-handoff.md)). A hypothesis is welcome as a starting point, not as a specification |

The recommended levels mean:

- **`hypothesis`**: what the artifact states is believed, not yet seen.
- **`observed`**: what it states has been seen in real use, interviews or
  data, at least once.
- **`validated`**: what it states has been tested on purpose, and the test
  came out as the artifact says.

The levels are ordered: each one ranks above those before it in the list.
`product.evidence.required` must be one of them.

**How a level is raised is not decided in this revision.** What proves an
artifact `observed` or `validated`, and how that proof is written next to
the level, is left to a later revision of this convention. Until then, the
level is declared by whoever writes the artifact, and review judges it.

Everything below disappears when you rule, from this sentence up to the
Consequences heading, which stays.

**How to rule: five steps, all in this file.** Read all of them before
doing any, because the last one deletes the other four, and do them in one
commit.

1. **Write the value of each key** under `traits:` in the frontmatter, or,
   if you rule `rejected`, **remove the whole `traits:` block**.
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
check: npx --no-install ontrack-product-check ADR-0004
traits:
  product:
    evidence:
      levels: [hypothesis, observed, validated]
      required: observed
```

**The `check:` line stays.** Once this ADR is `accepted`, it reads these
keys and, from ADR-0003, `product.artifacts.root`. It fails when the levels
are empty or repeat a value, when the required level is not one of them,
and on every product artifact whose frontmatter has no `evidence:` key or a
value outside the levels. It reads the `evidence:` key and nothing else: it
does not judge whether a level is deserved. An artifact at `hypothesis`
passes: the gate is on changes, in ADR-0005.

## Consequences

### Positive

- How sure an artifact is reads in one key, before its prose.
- A hypothesis can be written down and shared without being mistaken for a
  specification.

### Negative

- The level is self-declared: an artifact can claim `observed` with
  nothing behind it, until a later revision says what proves it.
- Every artifact needs one more key, which pm-skills does not write.

### Neutral

- The level describes the artifact as a whole, not each of its claims.

## Alternatives Considered

### Three levels, `observed` required

Recommended, as above.

### Two levels, `hypothesis` and `validated`

Simpler, but it forces a choice between a guess and a tested result, and
most product knowledge sits between them.

### Proof required with the level

Each level would come with the source that supports it, and the check would
require one. Deferred: what counts as proof differs between teams, and
deciding it now would freeze a guess.

### No evidence field

Artifacts stay as pm-skills writes them. Nothing tells a supported PRD from
an unsupported one, and ADR-0005 has nothing to gate on.

## References

- [ADR-0003](ADR-0003-location.md): which files are product artifacts.
- [ADR-0005](ADR-0005-handoff.md): where the required level is enforced.

**The keys.**

| Key | What it holds | Allowed values |
| --- | --- | --- |
| `product.evidence.levels` | the evidence levels, weakest first | a list of distinct names, at least one |
| `product.evidence.required` | the level an artifact must reach before a change builds on it | one of `product.evidence.levels` |

**Both keys are required**: an empty key is not a value. The check needs
ADR-0003 accepted.
