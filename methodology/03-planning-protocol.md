# Methodology — Planning Protocol (Stage 3)

## Purpose

Turn the brief and domain map into a structured plan that tells the implementor exactly what to build, and tells the architect exactly what to evaluate. A good plan eliminates ambiguity in the implementation and produces a verdict-ready artifact for the architect.

## Inputs

- `## Brief` section (from Stage 1).
- `## Domain Map` section (from Stage 2).
- Any prior plans referenced under `docs/plans/archive/`.

## Output

A `## Plan` section appended to the plan file.

Frontmatter advances to `stage: plan, status: draft` (it moves to `status: approved` only after Stage 4).

### Plan shape

```markdown
## Plan

### Summary
<2–4 sentences. What's being built, in plain language. What changes externally when it ships.>

### Approach
<the chosen approach in prose. Why this approach over alternatives — name the alternatives you considered. Reference the domain map: "reusing validateInput from src/util/validate.ts:42".>

### Files to modify
| Path | Change | Why |
|------|--------|-----|
| src/foo.ts | add idempotency check before write | brief requires no double-writes |
| src/bar.test.ts | new test for replay scenario | verifies success signal |

### Files to create
| Path | Purpose |
|------|---------|

### Data flow (proposed)
<short prose or ASCII diagram. Highlight the diff vs. the current data flow from the domain map.>

### Edge cases
<numbered. For each: input or condition, expected behavior, why this case exists.>
1. ...

### Test strategy
- **Unit:** which functions get unit tests, with which scenarios
- **Integration:** which flows get integration tests
- **Manual:** what you'll click through or run by hand before declaring done
- **What's NOT tested:** be explicit; the architect should not have to ask

### Rollback plan
<if this ships and breaks production, how do we back it out? feature flag? revert? data migration reversal?>

### Risks & mitigations
| Risk | Likelihood | Blast radius | Mitigation |
|------|-----------|--------------|------------|

### Out of scope (carried over from brief)
<echo the non-goals list verbatim — keeps the architect's review honest>

### Open questions for the architect
<anything you genuinely couldn't decide; not a dumping ground>
```

## Tasks and estimates

After architect APPROVAL and user acknowledgment, `/plan` seeds a `## Tasks` section AND a `## Estimate` summary. Estimates use **decimal hours** (`0.5`, `1`, `2`, `4`, `8`) appended to each task line:

```markdown
## Tasks

**Implementation tasks**
- [ ] T1. Restructure OrderDrawer.tsx body into 4 cards — 4h
- [ ] T2. Adopt the Drawer primitive's footer slot — 1h
- [ ] T3. Add View customer conversations CTA — 0.5h
```

Format is strict: ` — <N>h` at the end of the task line. `<N>` is a positive number; `0.5` is allowed; whole numbers don't need a decimal. The `—` is an em dash (U+2014). The Jira-sync script parses this regex; deviations are silently ignored (estimate not pushed).

After the task list, `/plan` writes:

```markdown
## Estimate

| Group | Hours |
|-------|-------|
| Implementation | 12 |
| i18n | 1 |
| Tests | 3 |
| Verification | 2 |
| **Total** | **18h (~2 dev-days)** |

**Story points:** 5
```

The total is the sum of every per-task hour plus a rough day conversion (8h = 1 dev-day; round up). The story points line is **optional** — when present, `/jira-sync` writes it to Jira's "Story point estimate" custom field.

**SP convention: 1 story point = 1 dev-day (8h).** Story points and dev-days are the same number; they're a calendar/capacity unit, not a Fibonacci complexity score. The script suggests `ceil(total_hours / 8)` during dry-run. Teams using the Fibonacci complexity convention should override the planner's value manually.

### Who estimates and reviews

- The **planner** drafts per-task estimates AND the `## Estimate` summary as part of Stage 3.
- The **architect** treats unrealistic estimates as a WARNING during plan review.
- The **user** can override during the Stage 4 approval picker via the "Approve with amendments" option.

### What "unrealistic" means for the architect

- A task involving new state machines or async coordination estimated < 1h
- A test task with > 3 assertions estimated < 1h
- A whole-plan total < 4h — almost always means the planner missed scope
- A whole-plan total > 24h (3 dev-days) — almost always means decomposition was skipped at intake; consider splitting

Estimates aren't a contract; they're a sanity check. The build phase tracks actual time separately and post-merge calibration improves future estimates.

### Jira mapping

When `/jira-sync` pushes the plan:
- Per-task hours appear inline on each Jira taskList item (`T1. ... — 4h`).
- The plan **total** is sent to Jira's built-in `timetracking.originalEstimate` on the parent ticket (formatted as `<N>h`).
- The plan's **Story points** value is sent to the configured Jira custom field (default `customfield_10016`, "Story point estimate"). The field id is configured per-instance in `~/.claude-development-eco-system/jira.json` under `story_points_field`. If the config doesn't have that key, the script skips the SP push and tells the user during dry-run.

## Drafting the plan

### The order matters

Write **Summary** last, after the rest of the plan exists. It's a header for a thing you've already designed; it can't be honest until you know what you're committing to.

Write **Files to modify / create** *before* **Approach**. Listing the actual files first forces concreteness — if you can't list them, you don't have a plan, you have a wish.

Write **Edge cases** by walking each row of the Files-to-modify table and asking: "What inputs make this break?" Don't pull edge cases from a generic checklist.

### Reuse is the default

For every component you're adding, search the domain map first. If the map says something similar exists at `path:line`, you must:
- Reuse it, OR
- Reuse-with-extension (modify the existing thing to fit), OR
- Justify in the **Approach** section why a new thing is necessary.

"It's cleaner to write a new one" is not a justification. "The existing one assumes synchronous I/O and our path is async" is.

### Test strategy is not a checkbox

The test strategy section is where most plans get lazy. The standard is: an architect should be able to read the test strategy and predict which tests will fail if the implementation is wrong. If it's just "I'll write unit tests," that's not a strategy.

For each piece of behavior in the plan, name the test that covers it (or explicitly say it's covered by an existing test). For each risk in the Risks section, name the test that would catch a regression.

### Rollback is not optional

Every plan that touches production has a rollback story. "Revert the commit" counts only if there's no data migration, no schema change, and no external side effect. If there is, the plan needs a real rollback.

For pre-prod plans (internal tooling, dev infra), the rollback section can be a single line: "n/a — no production exposure."

## Sizing

A good plan is **1–3 pages of markdown**. If yours is longer:

- Are there really multiple plans hiding in one? Split.
- Are you over-explaining the approach? The architect's job is to decide if the approach is sound, not to be tutored.
- Is the test strategy a wall of test names? Group them; describe categories, not every assertion.

A good plan is **never less than 1 page**. If yours is shorter, you're missing edge cases, risks, or the rollback story.

## When the plan is wrong

If during planning you realize the brief's success signal doesn't match what the code can do — stop. **Go back to intake**, update the brief with the user. Don't paper over the gap with a clever plan. The brief is the contract; if the contract is wrong, fix the contract.

Same applies if research reveals an architectural constraint that makes the brief's goal infeasible without a larger change. That's a separate plan; flag it and ask.

## Anti-patterns

- **Plans that describe the solution but not the change.** "Add caching to user lookups" is a wish. "Wrap getUserById in src/users/service.ts:42 with an LRU cache (size 1000, TTL 5min) backed by node-lru-cache" is a plan.
- **No file list.** If the plan doesn't say which files change, the architect can't review it.
- **No edge cases.** Every plan has edge cases; if you didn't write any, you didn't think about them.
- **Test strategy that says "TDD."** TDD is a method; the architect needs to know *what* is tested, not *when*.
- **Risks section that says "minimal."** Either be specific or admit you didn't audit. "Minimal" is a way to skip the section.
- **Coupling unrelated work.** A plan should do one thing. If you find yourself adding "while we're in here..." — stop. New plan.

## Handoff to Stage 4 (Align)

The plan is complete when every section is populated, the file list is concrete, the test strategy is predictive, and the rollback is real. Frontmatter is at `stage: plan, status: draft`.

`/plan` then invokes `dev-architect` for review. The architect reads the brief + domain map + plan and issues APPROVED or REJECTED with severity-tagged concerns.
