---
name: feature
description: End-to-end feature command. One invocation drives all 7 internal phases (Frame → Map → Plan + Architect gate → Branch + optional Jira sync → 5-role build gate → Ship/PR → Address review). Resumable via plan-file frontmatter. Use when (1) building a new feature on an existing codebase, (2) any change that justifies a written brief and architect-approved plan, (3) work that touches multiple files or has non-trivial blast radius, (4) the user says "let's add", "let's build", "implement", "ship", "deliver". Falls back to suggesting /quick-fix when the work is too small (< 30 lines, < 3 files, single obvious cause), or /dev-roles when you want to skip the intake/research/plan ceremony. Reuses the dev team's 5 unchanged role prompts at ~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/. Optional Jira sync (--jira KEY) and PR auto-open (--no-pr to skip).
argument-hint: <description> [--jira KEY] [--no-pr] [--mode=full|fast] [--resume <slug>]
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
---

# /feature — End-to-End Feature Command

You are running the full feature loop: brief → research → plan → architect approval → branch → build (5-role gate) → ship → address review. The user invokes this skill **once** with a description; the skill drives every internal phase to completion (or stops at any phase boundary on user request).

This skill replaces 9 prior commands (`/intake`, `/scope`, `/research`, `/plan`, `/jira-sync`, `/start-dev`, `/dev-roles`, `/ready-for-review`, `/address-review`) by absorbing their logic as internal phases A–G. The dev team's 5 role prompts are read verbatim, never modified. Any per-phase methodology lives at `~/sourceControl/claude-development-eco-system/methodology/`.

---

## Auto-activated knowledge skills

Throughout `/feature`, these skills load on activity (no explicit invocation):

- **`knowledge/context-engineering`** — governs which files to load at each phase
- **`knowledge/source-driven-development`** — Architect/Implementor cite docs for framework decisions
- **`knowledge/incremental-implementation`** — Phase E enforces ~100-line vertical slices
- **`knowledge/debugging-and-error-recovery`** — when Phase E hits failures, this skill takes over

Read those files when you are about to enter a phase that they affect.

---

## Canonical role prompts (read each, do not modify)

```
~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/cto.md
~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/architect.md
~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/implementor.md
~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/code_reviewer.md
~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/wiring_expert.md
```

Phase E plays each role in sequence. **Read the role prompt before switching voice.** Per user constraint: these are NEVER edited by this skill.

---

## Pre-flight

1. **Parse arguments.** Extract description, `--jira KEY`, `--no-pr`, `--mode=full|fast`, `--resume <slug>`.
2. **Resume vs new.** If `--resume <slug>` or a `docs/plans/<slug>.md` exists matching the description, resume — read frontmatter `phase:` and jump there. Otherwise compute slug from description (lowercase-hyphen) and start at Phase A.
3. **Size sanity check.** If the description sounds like a typo / one-line fix / hotfix → suggest `/quick-fix` instead and stop. If it sounds like a new project / multi-week initiative → suggest decomposition first.
4. **Branch state.** Check `git status`. If on `main`/`master` with uncommitted changes, stop and ask. If clean, fine.
5. **Jira optionality.** Without `--jira KEY`, every Jira-related step is skipped silently. Don't error.

---

## Plan-file frontmatter (single source of truth for resume)

The skill writes/updates `docs/plans/<slug>.md` with frontmatter on every phase boundary:

```yaml
---
slug: <slug>
description: <one-line>
status: brief | research | planned | branched | building | review-ready | review-addressed | shipped
phase: A | B | C | D | E | F | G | done
created_at: <ISO>
started_at: <ISO>          # set in Phase D
done_at: <ISO>             # set when Phase G completes (or earlier with --no-pr)
jira: <KEY> | null
mode: full | fast
estimate_hours: <number>   # set in Phase C
estimate_story_points: <int>
architect_verdict: APPROVED | null
architect_cycle: <int>     # cycle count (cap 3)
branch: plan/<slug> | null
pr_url: <url> | null
---
```

Read frontmatter on every invocation. Each phase reads on entry, writes on exit.

---

## Phase A — Frame (Brief)

**Goal:** Brief the work in 8–15 lines. Auto-decide between scope-style (clear verb+object) and intake-style (ambiguous, needs clarification).

**Scope-style trigger.** If the description has a clear verb + object ("add idempotency to webhook handler", "fix leaderboard userId leak", "improve order drawer"), draft a speculative Brief from existing repo context (read root `CLAUDE.md`, `docs/onboarding/architecture.md` if present, the obvious target file) and ask 1–2 anchored questions on irreducibles only (success signal, trigger, deadline if any).

**Intake-style trigger.** If the description is ambiguous ("improve auth", "make it faster", "fix the bug"), ask up to 4 clarifying questions per round using AskUserQuestion. Cap at 2 rounds before surfacing back to the user. Detect oversized requests and propose decomposition.

**Brief shape (write to `docs/plans/<slug>.md`):**

```markdown
# <description>

## Brief
**Goal:** <one paragraph — what we're building, who benefits>
**Why now:** <motivation, deadline if any>
**Constraints:** <list>
**Non-goals:** <what we are explicitly not doing>
**Success signal:** <observable, testable condition that proves we're done>
**Stakeholders:** <if any>
**Open questions:** <if any remain>
```

**Stop signal.** Set `status: brief`, `phase: B`. Ask the user "continue to Phase B (research/map)?" — wait for explicit yes.

---

## Phase B — Map (Research / Domain Map)

**Skip if `--mode=fast`** — fold a 1-paragraph "what code does this touch" into Phase C instead.

**Spawn `dev-explorer`** (read-only codebase scout, agent at `agents/dev-explorer.md`) with:

> Produce a Domain Map for the work described below. Cover entry points, the components/services involved, reusable utilities that could be extended (REUSE BEFORE INVENT), patterns this codebase already uses for similar work, risks, and surprises. Cite file:line for every claim. Cap at 250 lines.
>
> Brief:
> <paste Brief from Phase A>

**Append the result to `docs/plans/<slug>.md`** under a `## Domain Map` heading.

If the repo has `docs/onboarding/` artifacts (from a prior `/learn` run), reference them rather than re-deriving — `architecture.md`, `hot-spots.md`, `conventions.md` are pre-mapped knowledge.

**Stop signal.** Set `status: research`, `phase: C`. Ask to continue.

---

## Phase C — Plan (Architect Gate)

**Read `~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/architect.md`.** Obey it.

**Draft the Plan.** Append to `docs/plans/<slug>.md`:

```markdown
## Plan

### Approach
<paragraph>

### Files to modify
<list with path + one-line description>

### Files to create
<list with path + purpose>

### Data flow
<short narrative>

### Edge cases
<list with handling>

### Tests
<what unit/integration tests will be written>

### Rollback
<how to revert if it goes wrong>

### Risks
<flags + mitigations>

### Estimate
| Task | Hours | Notes |
|---|---|---|
| <task 1> | <h> | |
| ... | | |
| **Total** | <H> | |

**Story points:** `max(1, ceil(H/8))` (1 SP = 1 dev-day per the user's convention)
```

**Architect review.** Switch voice to Architect, read against the Architect prompt's criteria, produce the structured JSON verdict (APPROVED / REJECTED with severity-tagged concerns). Use the existing `dev-architect` agent at `agents/dev-architect.md` if running in a multi-context team setup.

**Verdict handling:**
- **APPROVED** → present to user, ask for explicit ack via AskUserQuestion (silence ≠ approval). On ack, set `status: planned`, `phase: D`. Stamp `architect_verdict: APPROVED`, `estimate_hours`, `estimate_story_points`.
- **REJECTED** → revise plan, increment `architect_cycle`. Re-run architect. Cap at 3 cycles before surfacing to user.

**Freeze invariant.** Once `status: planned`, the Plan section is frozen. Subsequent phases must NOT modify it without an explicit plan amendment cycle.

---

## Phase D — Branch + Sync

**Pre-flight:**
- Refuse if uncommitted changes exist
- Refuse if a `plan/<slug>` branch already exists locally or remote — ask user to resolve

**Sync main and create branch:**
```bash
git fetch origin
git checkout main && git pull --ff-only
git checkout -b plan/<slug>
```

Stamp `started_at: <ISO>`, `branch: plan/<slug>`, `status: branched`.

**If `--jira KEY`:**
1. Push curated subset (Brief + Plan Approach + Tasks + plan-file link) to the Jira ticket as ADF
2. Transition To Do → In Progress
3. Leave a one-line audit comment

If `--jira` is absent, skip silently.

Set `phase: E`. **No stop signal here** — Phase D is fast and Phase E follows immediately unless the user invoked `/feature` with an explicit stop-after flag.

---

## Phase E — Build (5-Role Gate)

**Read all 5 role prompts before starting** — they govern this phase end-to-end.

```
~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/cto.md
~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/architect.md
~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/implementor.md
~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/code_reviewer.md
~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/wiring_expert.md
```

Stamp `status: building`. Announce each role switch on its own line.

### E.1 — [CTO]

Decompose the approved Plan into discrete tasks with acceptance criteria + scope boundaries. Output as JSON per the CTO prompt.

### E.2 — [IMPLEMENTOR] (plan-level — already approved upstream)

Phase C already produced the architect-approved plan. The Implementor reads it as the binding contract. Skip Implementor's Phase 2 (re-planning) — the plan is frozen.

### E.3 — [IMPLEMENTOR] (build)

Implement the approved plan. **Knowledge/incremental-implementation auto-activates here** — enforce ~100-line vertical slices, test after each, commit with descriptive message after each. Do not exceed the approved scope.

If failures occur during build, **knowledge/debugging-and-error-recovery auto-activates** — apply the 6-step triage, fix root cause, write regression test, then resume.

If architectural ambiguity arises mid-build, cross-consult `[ARCHITECT]` — answer briefly, switch back. Log the consultation in the plan file.

### E.4 — [CODE REVIEWER]

Review the implementation per the Code Reviewer prompt's 9-dimension checklist (load `~/sourceControl/claude-development-eco-system/skills/code-review/SKILL.md` first if it exists, otherwise apply the prompt's checklist directly). Produce structured verdict (APPROVED / REJECTED) with severity-tagged findings.

### E.5 — [WIRING EXPERT]

Trace the feature end-to-end. Verify import completeness (Section 4a of the wiring expert prompt — most common production crash), entrypoint registration, dependency resolution, no dead code, no silent regressions. Produce structured verdict with required `trace` block.

### E.6 — Evaluate gates

- **Both APPROVED** → set `status: review-ready`, `phase: F`. Phase E done.
- **Either REJECTED** → switch back to `[IMPLEMENTOR]`, address every blocking finding AND every warning (Phase 5b — warnings before TASK_DONE). Re-run only the rejecting reviewer. Cap at 3 rejection cycles before surfacing to user.

Resolve every Architect/Wiring warning from the cycle before declaring TASK_DONE per Implementor Phase 5b.

---

## Phase F — Ship

**Skip with `--no-pr`.** If `--no-pr`, set `status: shipped`, `phase: done`, `done_at:`, and exit. Commit is local for manual review.

**Pre-flight:**
- Refuse if uncommitted changes exist (the build phase should have committed everything)
- Refuse if current branch is trunk
- Refuse if `gh` is not authenticated
- Refuse if `status: draft` (not approved)

**Local quality gate.** Detect stack and run:
- Node: `npm test && npm run build && npx tsc --noEmit && npm run lint --if-present`
- Python: `pytest -q && (mypy . || true)`
- Rust: `cargo test && cargo build`
- Go: `go test ./... && go build ./...`

If any fails, stop and surface to user. `--skip-checks` overrides (logged in PR body).

**Push and open PR:**
```bash
git push -u origin plan/<slug>
gh pr create --title "<curated from plan>" --body "$(cat plan-pr-body.md)"
```

PR body curated from plan: Summary + Files-changed + Plan-source link + Architect/Wiring verdicts + structured `Jira-Ticket: <KEY>` line if `--jira` was set.

**If `--jira KEY`:** transition Jira → In Review.

Set `status: review-ready`, `phase: G`, `pr_url: <url>`.

---

## Phase G — Address Review (interactive, optional)

**This phase is opt-in** — the user can stop after Phase F and run `/feature --resume <slug>` later when the AI PR review GHA has posted findings.

**Pre-flight:**
- Refuse if PR is merged or closed
- Refuse if there are uncommitted local changes that aren't on the PR branch

**Fetch comments via gh:**
```bash
gh pr view <pr_url> --comments --json comments
gh api repos/:owner/:repo/pulls/<num>/comments
```

Parse the AI review GHA's `## Findings` section into structured items (severity / file:line / issue / fix).

**Picker:** address all / address selected / skip-with-rationale (posts rationale to PR) / cancel.

**Per-fix workflow:** read context → surgical Edit → run tests → commit → push (re-triggers GHA review).

Loop until user is satisfied or all findings addressed. Set `status: review-addressed`.

After human merges PR, the `jira-on-merge.yml` GHA transitions Jira → Done automatically (if Jira-Ticket: line present in PR body).

---

## Final phase — `/done` integration

After PR merges, the user runs `/done <slug>` separately to:
- Stamp `done_at`, `actual_hours`, `accuracy_ratio` into plan frontmatter
- Append calibration row to `docs/metrics/calibration.tsv`
- Archive plan to `docs/plans/archive/<slug>.md` via `git mv`

`/feature` does NOT auto-invoke `/done` — that's a deliberate human checkpoint after merge.

---

## Resume contract

State lives in plan-file frontmatter. On every invocation:

1. If `--resume <slug>` or matching plan file exists → read frontmatter, jump to `phase:` value
2. If `phase: done` → ask whether to re-run a phase or do nothing
3. Bump session count if you want telemetry, but it's not required

---

## What this skill explicitly does NOT do

- ❌ Modify any role prompt at `~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/`
- ❌ Auto-merge PRs
- ❌ Auto-deploy
- ❌ Auto-invoke `/done` (human checkpoint)
- ❌ Skip the Architect approval gate
- ❌ Allow more than 3 architect rejection cycles or 3 reviewer rejection cycles
- ❌ Push to trunk
- ❌ Touch source files outside the approved Plan's scope
- ❌ Sync to Jira when `--jira` is absent

---

## Anti-rationalization table

| Rationalization | Reality |
|---|---|
| "This is just a small feature, skip Phase B (Map)" | Use `--mode=fast`. Don't unilaterally skip — the Map section in fast mode is 1 paragraph, not 0. |
| "The architect waved through similar plans before, this'll APPROVE" | Run the gate honestly. The plan is the binding contract for Phase E; rubber-stamping breaks the gate's value. |
| "I'll fix the wiring stuff later" | Wiring Expert blocks for a reason — the most common production crash is `ReferenceError: X is not defined` from a missing import. |
| "The PR review GHA will catch issues, skip the local quality gate" | The GHA is advisory and async. The local gate catches issues before the push round-trip. |
| "Jira sync is annoying, I'll do it manually later" | If you have `--jira`, run it. If you don't want Jira on a task, omit the flag. Manual sync drifts. |
| "I'll just edit the plan after approval, no one will notice" | The freeze invariant exists because Phase E binds to the approved plan. Mid-build amendments require an explicit cycle, not silent edits. |

---

## Red flags

- Plan-file `phase:` frontmatter doesn't match what the skill is actually doing → resume logic broken, fix before continuing
- Architect APPROVED on cycle 0 with zero concerns on a non-trivial change → didn't actually look at the code, re-run
- Wiring Expert APPROVED without a `trace:` block → didn't actually trace, re-run
- Phase E commit without test additions → Implementor cut a corner, reject
- More than 30% of plan story points spent in Phase A/B → over-research; the plan should converge

---

## Examples

```
/feature add /api/health endpoint
  → Phase A scopes (clear verb+object), Phase B maps, Phase C plans + architect approves, Phase D branches, Phase E builds with 5-role gate, Phase F opens PR, Phase G addresses review

/feature improve auth
  → Phase A intakes (ambiguous), asks 4 clarifying questions, then proceeds

/feature migrate to React 19 useActionState pattern --jira FRONT-142
  → full pipeline + Jira sync at D and F

/feature add rate limiter --no-pr --mode=fast
  → A → C (skips B), D, E, then stops — no PR opened, commit local

/feature --resume add-rate-limiter
  → reads plan frontmatter, jumps to current phase
```
