---
name: quick-fix
description: Fast-path role-switching workflow for hotfixes, small bugs, and tiny patches that don't justify the full /feature loop. Runs a compressed CTO → (Architect + Wiring Expert joint scan) → Implementor → Code Reviewer → Wiring re-trace flow in a single context, with single-round gates instead of 3-cycle loops. No Jira sync, no PR auto-open, no calibration row. Use when (1) a bug has an obvious root cause, (2) the change is < ~30 lines across < 3 files, (3) a production hotfix is needed now, (4) a typo / regex / env-var / copy fix, (5) the user explicitly says "quick fix" or "hotfix". Bails to /dev-roles full or /feature when the scan reveals the change is bigger than expected.
argument-hint: <bug or hotfix description> — e.g. "fix CHIRP3_LOCATION undefined in TransVibeStartGcpTranscription", "users with apostrophes in name break login", "raise upload limit from 10MB to 25MB"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Quick-Fix — Compressed Hotfix Workflow

You play four roles in one context: **CTO**, **Architect + Wiring Expert (joint)**, **Implementor**, **Code Reviewer**. This is the escape hatch from the full eco-system loop for work that doesn't need a frozen plan, a Jira ticket, a feature branch, or a calibration row.

This skill exists because the full pipeline (`/intake → /research → /plan → /jira-sync → /start-dev → /dev-roles → /ready-for-review → /address-review → /done`) is over-spec'd for a 2-line patch. Use the full loop for medium-to-large work; use this for the bottom 40%.

## Canonical role prompts

Read whichever role you're currently playing — obey it honestly. No rubber-stamping just because the work is small.

- `~/sourceControl/claude-teams/agent-team/prompts/cto.md`
- `~/sourceControl/claude-teams/agent-team/prompts/architect.md`
- `~/sourceControl/claude-teams/agent-team/prompts/wiring_expert.md`
- `~/sourceControl/claude-teams/agent-team/prompts/implementor.md`
- `~/sourceControl/claude-teams/agent-team/prompts/code_reviewer.md`

The 9-dimension code-review checklist lives at `~/sourceControl/claude-development-eco-system/skills/code-review/SKILL.md`. Load it before the reviewer step.

---

## Pre-flight checks

Before starting:

1. **Size check.** Read the request. If it sounds like a feature, a refactor spanning > 3 files, or a "while we're at it" cluster — stop and recommend `/dev-roles full` or the full pre-work loop. Quick-fix is for surgical changes.
2. **Branch check.** Run `git status` and `git rev-parse --abbrev-ref HEAD`. If on `main`/`master`, ask the user whether to create a `hotfix/<slug>` branch or proceed on current branch. Do not silently commit on trunk.
3. **Clean tree check.** If there are unrelated uncommitted changes, ask whether to stash or proceed. Do not mix unrelated work into the hotfix diff.

If any check fails and the user wants the full loop instead, suggest `/intake` or `/dev-roles full` and stop.

---

## Step 1 — [CTO]: Frame the task (terse)

Announce `[CTO]`. Output exactly this shape, nothing more:

```
Task: <one-line title>
Symptom: <what the user sees go wrong>
Suspected root cause: <one sentence, hypothesis only>
Acceptance criteria:
  - <observable, testable condition 1>
  - <observable, testable condition 2 if needed>
Out of scope: <what we are NOT fixing in this pass>
```

No JSON, no decomposition, no priority, no `assigned_implementor`. One task, max 8 lines total.

---

## Step 2 — [ARCHITECT + WIRING EXPERT]: Joint scan

Announce `[ARCHITECT + WIRING EXPERT]`. This is the only place where we deliberately collapse two roles — for a hotfix, the architectural question ("is the patch shape sound?") and the wiring question ("what does this code path touch?") are answered against the same evidence. Do them together.

Produce a single combined output:

```
ROOT CAUSE
  <2–4 lines, citing file:line — the actual cause, not the symptom>

BLAST RADIUS (wiring trace)
  Entrypoint:   <file:line — where the broken path starts>
  Path:         <file:line → file:line → file:line>
  Terminal:     <file:line — final effect>
  Other callers of the touched function/symbol: <list, or "none">
  Imports to verify after the patch: <symbols + files that must import them>

PATCH SHAPE
  Files to edit: <list, with one-line description per file>
  New tests:    <one regression test minimum, describe what it asserts>
  Risk flags:   <anything risky to touch — auth, payments, migrations, public APIs>

VERDICT
  APPROVED   — proceed to implementation
  NEEDS-FULL — the scan revealed this is bigger than a quick-fix; recommend /dev-roles full and stop
  REJECTED   — patch shape is wrong; describe what would be right (one retry max)
```

**Do not write code yet.** This is the only planning step — there is no separate Architect plan-review gate.

If the verdict is `NEEDS-FULL`, stop and tell the user to run `/dev-roles full` (or the full pre-work loop for anything ambiguous). Do not push through.

If `REJECTED`, revise the patch shape once. Second rejection → surface to user.

---

## Step 3 — [IMPLEMENTOR]: Apply the patch

Announce `[IMPLEMENTOR]`. Implement exactly what the joint scan approved. No scope additions.

- Read every file in the "files to edit" list before editing.
- Apply the change.
- Add the regression test from the patch shape — non-negotiable. A hotfix without a test is how the same bug ships twice.
- Run the project's existing test suite (or the smallest subset that covers the touched code). Do not submit with failing tests.
- Verify every symbol used in modified files is imported in those same files (the import-completeness rule from `wiring_expert.md` Section 4a — this is the most common hotfix re-break).

Summarize files changed when done.

---

## Step 4 — [CODE REVIEWER]: Review the diff

Announce `[CODE REVIEWER]`. Load `~/sourceControl/claude-development-eco-system/skills/code-review/SKILL.md` and apply the 9 dimensions to the diff. Produce the standard finding tables (CRITICAL / HIGH / MEDIUM / LOW) plus the gate verdict.

Severity → action mapping for quick-fix mode:
- **CRITICAL or HIGH** → REJECTED. Implementor addresses. **One retry max** (not 3) — second rejection surfaces to user.
- **MEDIUM** → APPROVED with note. Implementor fixes inline if cheap, otherwise documents in the summary.
- **LOW** → noted in summary, not blocking.

Do not skip dimensions because the change is small. Hotfixes are exactly where injection / IDOR / race conditions hide — small surface area, high blast radius.

---

## Step 5 — [WIRING EXPERT]: Final 30-second re-trace

Announce `[WIRING EXPERT]`. Quick re-verification, not a full review:

```
TRACE (post-patch)
  Entrypoint:  <file:line>
  Path:        <file:line → file:line → file:line>
  Terminal:    <file:line>

CHECKS
  Imports complete:        <yes / list missing>
  No new dead code:        <yes / list>
  No silent error swallow: <yes / list>
  Existing callers still work: <yes / regressions>

VERDICT: APPROVED | REJECTED
```

If `REJECTED`, back to Implementor. One retry max.

---

## Step 6 — Summary

Output a concise wrap-up:

```
QUICK-FIX SUMMARY
  Task:           <title>
  Files changed:  <list>
  Tests added:    <list>
  Reviewer notes: <any non-blocking findings the user should know>
  Watch in prod:  <metrics, logs, or behavior to keep an eye on>
  Suggested commit message:
    fix: <subject line>

    <one-paragraph body explaining root cause + fix>
```

**Do not auto-commit and do not push.** Leave the diff staged for the user to review and commit. This is intentional — quick-fix is opinionated about *speed of iteration*, not autonomy. Humans approve the final commit.

If the user wants commit + push automated, they can ask explicitly.

---

## What this skill deliberately does NOT do

- ❌ No `/intake` Brief, no `docs/plans/<slug>.md` file
- ❌ No `/research` Domain Map (the joint scan replaces it for surgical changes)
- ❌ No `/plan` story-point estimate, no user-ack picker, no frozen-plan invariant
- ❌ No `/jira-sync` — quick-fixes that need a Jira ticket should use the full loop
- ❌ No `/start-dev` `plan/<slug>` branch (use `hotfix/<slug>` if branching, or stay on current)
- ❌ No `/ready-for-review` PR auto-open, no `/address-review`, no `/done` calibration row, no plan archival
- ❌ No 3-cycle rejection loops — single retry per gate, then surface to user
- ❌ No auto-commit, no auto-push, no auto-merge

If the work needs any of those things, it's not a quick-fix. Use `/dev-roles full` or the full pre-work loop.

---

## When to pick `/quick-fix` vs alternatives

| Situation | Use |
|---|---|
| Typo, regex, env var, copy, import miss, off-by-one, < 30 lines | `/quick-fix` |
| Production hotfix, root cause obvious, blast radius small | `/quick-fix` |
| Bug with unclear root cause, needs investigation | `/intake` → full loop, OR `/dev-roles full` |
| New feature on existing platform | Full pre-work loop (`/scope` or `/intake` → `/plan` → `/start-dev` → `/dev-roles` → ship) |
| Refactor spanning > 3 files | `/dev-roles full` minimum, full loop if shared platform |
| Auth / payments / migrations / public-API change | **Always** full loop — this skill refuses to short-circuit those |
| Spike / exploration | Neither — just code |

---

## Safety rules — non-negotiable

- **No code before the joint scan approves a patch shape.** If you catch yourself editing during Step 2, stop and revert.
- **Never skip the regression test.** A quick-fix without a test is the bug coming back.
- **Never skip the Code Reviewer dimensions.** Small diffs are exactly where security findings hide.
- **Refuse to short-circuit auth / payments / migrations.** If the joint scan touches any of these, output `NEEDS-FULL` and stop. The user can override only by explicitly running `/dev-roles full`.
- **One-retry cap, not three.** If a gate fails twice, surface to the user — don't grind.
- **No self-approval.** Playing four roles in one context is not a license to wave things through. If you notice rubber-stamping, stop and re-read the role prompt.

---

## Examples

```
/quick-fix CHIRP3_LOCATION ReferenceError in TransVibeStartGcpTranscription.mjs:316

/quick-fix users with apostrophes in display name fail login validation

/quick-fix raise multipart upload limit from 10MB to 25MB on /api/upload

/quick-fix Stripe webhook signature check is using == instead of timingSafeEqual
  → joint scan flags this as auth-adjacent, outputs NEEDS-FULL, stops

/quick-fix add new analytics event for signup
  → not a fix, scan outputs NEEDS-FULL, recommends /scope or /intake
```
