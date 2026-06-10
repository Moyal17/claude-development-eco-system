# Methodology — Alignment Protocol (Stages 4 & 5)

## Purpose

Stage 4 (Align) takes a draft plan from Stage 3 to an explicitly approved, frozen artifact. Stage 5 (Handoff) packages that artifact for the build phase to consume. Together they are the gate that makes advisor-only autonomy safe: nothing irreversible happens until both an architect and the user have signed off.

## Stage 4 — Align

### Inputs

- A `stage: plan, status: draft` plan file with Brief, Domain Map, and Plan sections.

### Output

The same plan file with:
- An `## Architect Review` section
- An `## Approval` block with timestamp and signer
- Frontmatter advanced to `stage: approved, status: approved`

### The architect review

`/plan` invokes `dev-architect`. The architect reads the brief, domain map, and plan, and produces a structured verdict.

#### Architect review shape

```markdown
## Architect Review

**Verdict:** APPROVED | REJECTED
**Cycle:** 1 of 3

### Concerns
| Severity | Section | Concern | Required action |
|----------|---------|---------|-----------------|
| BLOCKER | Files to modify | `processPayment` is being modified but the plan doesn't address the existing race condition the domain map flagged | Address or explicitly defer with a follow-up plan reference |
| WARNING | Test strategy | "manual click-through" without a checklist | List the specific scenarios |
| SUGGESTION | Approach | Could reuse `idempotencyKey` helper from src/util/idempotency.ts:18 | Mention it or justify the new helper |

### Positive patterns
- Clear reuse of `validateInput` per the domain map
- Rollback plan addresses both code and data

### Notes for the implementor
- ...
```

#### Severity definitions

| Severity | Definition | Effect on verdict |
|----------|-----------|-------------------|
| **BLOCKER** | Plan would ship a bug, security issue, or fail the success signal | Forces REJECTED |
| **WARNING** | Plan has a real flaw but it's recoverable mid-implementation | Allowed in APPROVED, but implementor must address |
| **SUGGESTION** | Better path exists; current path isn't wrong | Allowed in APPROVED, implementor decides |

### The rejection cycle

- **REJECTED** → return to Stage 3. The implementor (or planner) revises the plan to address every BLOCKER. WARNINGs and SUGGESTIONS should be addressed too, but the verdict only blocks on BLOCKERs.
- After revision, re-run the architect review. Increment cycle count.
- **Cap: 3 cycles.** After three rejections of the same plan, stop and surface to the user. The plan or the brief is probably wrong at a level the planner can't fix alone.

### The user acknowledgment

Architect APPROVED is necessary but **not sufficient**. After APPROVED, `/plan` shows the user:

1. The Brief (top of file).
2. The Plan summary + Files-to-modify list.
3. The architect's verdict and any WARNINGs / SUGGESTIONs.
4. Asks: "Approve this plan? It will be frozen for the build phase."

The user must explicitly say yes. Silence or "looks good" without the explicit acknowledgment does not freeze the plan.

When the user approves, append:

```markdown
## Approval

- **Architect:** APPROVED (cycle 1)
- **User:** <user identifier> on <ISO timestamp>
- **Plan freeze:** files listed above are the contract; deviation requires re-planning.
```

Frontmatter advances to `stage: approved, status: approved`.

## Stage 5 — Handoff

### Output

The frozen plan file is now the input contract for the build phase. `/plan` performs three handoff actions:

1. **Generate task list.** Each row of the Files-to-modify table becomes a task. Each edge case becomes a verification task. Each test in the test strategy becomes a test task. Saved as a `## Tasks` section at the bottom of the plan file.
2. **Commit (if in a git repo).** The plan file is committed with message `plan: <slug> approved`. This makes the plan visible to PR reviewers later — they read the plan alongside the diff.
3. **Print the next-step command.** Tell the user exactly how to start the build: `/dev-roles full --from-plan docs/plans/<slug>.md` (or, in later versions, `/build`).

### Tasks shape

```markdown
## Tasks

- [ ] T1. Implement idempotency check in src/foo.ts (file change #1)
- [ ] T2. Verify replay scenario with new test (edge case #1)
- [ ] T3. Run integration test suite, confirm no regressions
- [ ] T4. Update docs/api.md with new behavior
```

Tasks are tracked in the build phase, not here. This is just the seed list.

## What it means to "freeze" a plan

Frozen means:
- **The Files-to-modify list is the contract.** Touching a file not on the list during build is a scope violation. The implementor must stop and re-plan, or surface to the user.
- **The success signal is the acceptance test.** If the implementation passes the success signal, it ships. If it doesn't, more work is needed regardless of internal opinions.
- **Changes require re-approval.** If the implementor discovers a flaw in the plan mid-build, they don't silently fix it. They surface, the architect re-reviews, and the user re-acknowledges if material.

## Anti-patterns

- **Architect approves their own plan.** The architect must not have written the plan — different role, different head. In single-context mode (`/dev-roles`), this means switching roles cleanly and applying the architect criteria honestly.
- **User approval inferred from silence.** If the user didn't say yes, the plan isn't approved. Period.
- **Approval before all WARNINGs are addressed.** A WARNING that's noted-but-ignored becomes a bug. They must be addressed in the plan revision before the architect re-issues APPROVED.
- **Frozen-but-flexible.** "We approved the plan but I'm just going to also fix this other thing while I'm in here" — no. Stop, surface, re-plan.
- **Skipping the cycle cap.** If you're on the third rejection, don't push for a fourth. The plan isn't going to converge; the brief is probably wrong.

## Why this is the gate

Everything before this stage is recoverable — research can be wrong, plans can be revised, briefs can be amended. After this stage, code gets written, tests run, PRs open. Mistakes downstream cost real time and real production risk. The two-key approval (architect APPROVED + user acknowledged) is the smallest reliable filter that catches both kinds of error: technical (architect catches) and intent (user catches).
