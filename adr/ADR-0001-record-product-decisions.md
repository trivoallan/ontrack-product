---
adr: ADR-0001
slug: record-product-decisions
title: Record product decisions
status: accepted
revision: 1
date: 2026-11-21
authors: [Tristan Rivoallan]
supersedes: []
check: npx --no-install ontrack-product-check ADR-0001
---

# Record product decisions

## Status

Accepted

> **This ADR is not a convention to rule on.** The other ontrack-product ADRs
> arrive with `status: proposed` and wait for your repository to rule on
> them. This one arrives `accepted`, because it describes the mechanics you
> will use to rule on the others. You can supersede it like any other ADR,
> with a new ADR that lists it in `supersedes:`. Until then, it is what says
> how these ADRs are written and ruled on here.

## Context

Product work done with coding agents leaves files behind: PRDs, problem
statements, hypotheses, interview syntheses. Where they go, how sure they
are, and whether engineering may build on them is decided in a conversation,
then decided again in the next one. An agent that finds no written rule
treats each choice as an accident.

These choices are rarely specific to one repository. ontrack-product ships
each of them as a **convention**: an ADR with the values it recommends and
why, which your repository imports through
[ontrack](https://github.com/trivoallan/ontrack) and rules on. This track
needs no other track installed: everything it relies on is written here.

What remains to decide is how these ADRs are written, shipped and ruled on.

## Decision

We will keep ontrack-product ADRs as follows.

**1. The format is Nygard's.** Every ADR has, in this order: `## Status`,
`## Context`, `## Decision`, `## Consequences` (with `### Positive`,
`### Negative` and `### Neutral`), `## Alternatives Considered` and
`## References`. Everything is in English.

**2. Files are named `ADR-NNNN-slug.md`** and numbered without gaps. ontrack
imports them into `docs/adr/product/`, or into the directory named after the
alias you installed the track under. Your repository's own decisions live in
`docs/adr/local/`, with their own numbering.

**3. The frontmatter is the machine source.**

```yaml
adr: ADR-0003        # must match the file name
slug: location       # must match the file name
title: Location
status: accepted     # proposed as shipped; accepted or rejected once ruled
revision: 1          # written by ontrack-product: it dates the convention, not the file
date: 2026-11-21     # the day you ruled
authors: [Your Name] # the people who decided, no email addresses
supersedes: []       # the ADRs this one replaces
check: npx --no-install ontrack-product-check ADR-0003  # see rule 8
traits: {...}        # the machine-readable part of the ruling
```

An ADR is superseded when another one lists it in `supersedes:`. The reverse
edge is not written: it would be a second place to keep in step.

**4. The body freezes once ruled; the status does not.** Once your
repository rules an ADR `accepted` or `rejected`, its text does not change,
and reopening the decision takes a new ADR. Only its `status` and its
`check:` line are still written. A superseded ADR stays in the directory: it
is a log of decisions, not a list of what is in force.

This freeze is about your ruling. The ADRs this package ships change only
through `revision` (rule 6).

**5. A convention arrives `proposed`, and the ruling is yours.** Every key
under `traits:` is empty. The Decision section states what ontrack-product
recommends and why, then a how-to-rule block, opened by a marker sentence,
that lists the steps to rule. Staying `proposed` is a state, not an
oversight: an agent reads a `proposed` convention as undecided.

A **trait** is a key this package ships and whose value is yours. The prose
explains and justifies; the trait is read without interpretation. All of
this track's traits sit under `product.`.

`accepted` means the values under `traits:` are in force. `rejected` is a
full ruling too: the convention does not apply here. Remove the whole
`traits:` block and say what stands in for the decision, so an agent knows
what to go by.

**6. `revision` dates the convention.** ontrack-product raises it by one
when, and only when, the convention changes: a trait added, removed or
renamed, an allowed value changed, or the recommended value changed. A
wording or link fix leaves it alone, and so does a change to a `check:` line
or to the script it runs. `ontrack plan` then reports an ADR as `revised`
only when there is something to rule on again. Each ADR above revision 1
ends with a **Revisions** list that says what changed and what to rule on
again.

**7. A half-ruled ADR fails.** This ADR's `check:` line runs
`ontrack-product-check ADR-0001`. It checks every copy of these ADRs that is
no longer `proposed` against the `.mdschema.yml` shipped next to them: status
decided, date set, authors named, no trait key left empty, the sections above
present, and the how-to-rule block gone. It names the file and the key.

**8. A `check:` line says when your work departs from a decision.** Every
ontrack-product ADR carries, in its frontmatter, a `check:` key holding
`npx --no-install ontrack-product-check <ADR number>`. Once your repository
rules the ADR `accepted`, `ontrack check` runs it from your repository's root
and reports `pass` or `fail`. The script reads the traits you ruled, so the
same line holds whatever you decide. It reads frontmatter and a few declared
lines, never the prose of your product artifacts, and it changes no file.
`--no-install` keeps `npx` from fetching anything. Read an imported `check:`
line as you would an npm install script: it runs this package's code in your
repository.

**9. If ontrack-product proposes the wrong convention,** rule it `rejected`
or write your own decision in `docs/adr/local/`, cite the ontrack-product ADR
you depart from, and say how.

## Consequences

### Positive

- Where product artifacts live, what they claim and when engineering builds
  on them is written in the repository, for people and agents alike.
- A repository starts from a reasoned recommendation, and rules on it in one
  commit.
- A ruled convention is checked by `ontrack check`, so a departure fails
  before review instead of in it.

### Negative

- If nothing runs `ontrack check`, in a pull request or elsewhere, nothing
  looks at the rulings.
- A convention as shipped fails the schema on purpose, so ontrack-product's
  own conventions are checked by review only.

### Neutral

- The mechanics match those of other ontrack tracks, so a repository that
  installs several reads one set of rules, but this track does not require
  any of them.

## Alternatives Considered

### Rely on another track's mechanics

ontrack-engineering ships the same rules in its own ADR-0001. Pointing to it
would make this track depend on another being installed, and a product team
may not want engineering's conventions.

### Ship rulings instead of conventions

Simpler to write, but the repository would have nothing to decide, and the
reasons would describe ontrack-product's context instead of its own.

### Hand-written decisions with no tooling

Nothing to install, and nothing machine-readable: finding the open
conventions means reading prose, and a half-filled ADR goes unnoticed.

## References

- Michael Nygard, [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) (2011).
- [ontrack](https://github.com/trivoallan/ontrack): imports these ADRs and reports `new`, `revised` and `removed` ones.
- [mdschema](https://github.com/jackchuka/mdschema): the checker behind `.mdschema.yml`.
