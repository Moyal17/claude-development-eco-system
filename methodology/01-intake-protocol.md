# Methodology — Intake Protocol (Stage 1)

## Purpose

Turn an ambiguous user request into a written brief that downstream stages can act on without further clarification. Intake is the *only* stage where the dominant mode is "asking the user questions" — the later stages should rarely need to interrupt.

## Inputs

- A natural-language request from the user (a sentence, a paragraph, a Slack thread, a ticket).
- Optional: a referenced ticket/issue, design doc, or prior conversation.

## Output

A `## Brief` section in `docs/plans/<slug>.md` containing:

```markdown
## Brief
- **Goal:** <single sentence — what changes for the user/system when this is done>
- **Why now:** <the trigger — incident, customer ask, deadline, dependency unblock>
- **Constraints:** <hard limits — backwards compat, perf budget, deadline, regulatory>
- **Non-goals:** <explicit list of things this is NOT — to prevent scope creep>
- **Success signal:** <observable, externally checkable — "X endpoint returns 200 within 100ms p99 under load Y", not "code is clean">
- **Stakeholders:** <who needs to be looped in for review/approval>
- **Open questions:** <anything the intake interview couldn't resolve — flagged for /research or for the user>
```

The plan file's frontmatter is set to `stage: intake, status: draft` after this stage.

## The intake interview

### When to ask vs. assume

**Ask** when:
- The request can mean two materially different things.
- The success signal is not observable from the request alone.
- There's a constraint the user might know that the codebase can't tell you (deadline, customer, regulatory).
- The blast radius is unclear (is this prod-touching? data-mutating? user-visible?).

**Assume + confirm in writing** when:
- The convention is well-established in the codebase or in `CLAUDE.md`.
- The risk of being wrong is low and visible (e.g., choice of test framework when the repo already standardizes on one).

**Never ask** about:
- Things you can determine by reading code (which file holds X, what version of Y is in use).
- Things the user has already said earlier in the same conversation.

### The clarification questions (in priority order)

1. **What's the goal in one sentence?** If the user can't say it in one sentence, the request is too big — split it.
2. **Why now?** Reveals the trigger and often the real constraint (deadline, incident, customer).
3. **What does success look like that someone other than you could check?** Forces an observable success signal.
4. **What's explicitly out of scope?** Flush out non-goals before they become scope creep.
5. **Are there constraints I won't find by reading the code?** Deadlines, partner commitments, regulatory, performance budgets.
6. **Who needs to approve / review?** Names, not roles, where possible.

Cap the interview at **4 questions in one round**. If the user wants to go deeper, they will. If you need more after the first round, batch them — don't drip-feed.

### Use AskUserQuestion when…

…you have 2–4 well-scoped, mutually-exclusive options and the user's choice meaningfully changes the downstream plan. Don't use it for free-form goal/constraint questions — those want prose.

## Detecting that the request is too big

If any of these are true, **stop and tell the user** before building a brief:

- The goal sentence has more than one verb that isn't connected by "and then" (e.g., "refactor auth *and* add SSO" — two goals).
- The success signal would require >5 distinct files or >2 system components.
- The "non-goals" list is empty because everything feels in scope.
- The user said "rewrite," "redesign," or "rebuild."

The right response is to propose a decomposition: "I think this is 3 separate plans. Want to do them as Plan 1: X, Plan 2: Y, Plan 3: Z, in that order?"

## Slug rules

The plan file's slug should be:
- Kebab-case
- Verb-first ("add-idempotency-to-webhook-handler", not "webhook-idempotency")
- ≤ 50 characters
- Stable — chosen during intake and never renamed (downstream stages reference it)

## Anti-patterns

- **Vague success signals.** "Code is clean" or "users are happy" is not testable. Push back until the user gives something checkable.
- **Implicit non-goals.** If the user only said what they want, ask what they don't want. Saves a re-plan later.
- **Asking the codebase questions.** "What language is this in?" — read it.
- **Skipping intake on small tasks.** Even a one-line change benefits from a one-line brief. The friction is small; the discipline compounds.

## Handoff to Stage 2 (Research)

The brief is complete when:
- All seven `## Brief` fields are populated (open questions can be empty).
- The user has read it back and acknowledged ("yes, that's right" or amended it).
- The plan file is committed (or at minimum saved) with `stage: intake, status: draft`.

`/research` reads the brief and uses **Goal**, **Constraints**, and **Non-goals** to decide what to scout.
