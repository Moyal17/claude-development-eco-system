# Example 01 — Add idempotency to webhook handler

A complete walkthrough of the pre-work loop on a small, realistic task. The single file `add-idempotency-to-webhook-handler.md` shows what `docs/plans/<slug>.md` looks like at every stage: Brief → Domain Map → Plan → Architect Review → Approval → Tasks.

## What this example demonstrates

| Section | What to look for |
|---------|------------------|
| Frontmatter | How `stage` and `status` evolve from `intake/draft` to `approved/approved` |
| Brief | Tight, observable success signal; explicit non-goals |
| Domain Map | Citations everywhere; "What surprised me" populated; reuse candidates flagged |
| Plan | Files-to-modify is concrete; alternatives considered; rollback is real |
| Architect Review | One WARNING tracked, no BLOCKERs, single-cycle approval |
| Approval | Both architect and user signed off; freeze stamped |
| Tasks | Seeded from the plan; ready for the build phase to consume |

## How to use this example

- **Reading order:** top to bottom. Each section was written by a different stage.
- **Reference:** when authoring a real plan, check this example for shape — especially the citation density in the Domain Map and the alternatives-considered pattern in the Approach.
- **Don't copy verbatim:** the example is illustrative. Real plans differ in shape because real tasks differ.

## What's intentionally absent

- The real source files this plan references — they don't exist; the file:line citations are illustrative.
- The build phase — Tasks are seeded but not executed. That's the next pass of the ecosystem.
- The Code Review and Wiring Review sections — those will be added by `/code-review` and the wiring-expert agent in later versions.
