# Retrospective — a dead guardrail passed two gates; only the adversarial pass caught it

**Date:** 2026-06-04
**Change under review:** dark-ship of the Claude tool-use agent loop (Maître.ai), branch
`feat/agent-loop-rewrite`, commit `899dddb`.
**Severity:** would-be production regression (a security/safety guardrail that the legacy path
enforced was silently absent on the new path). Caught pre-merge. No customer impact.

---

## What happened

The agent-loop rewrite ported the conversation engine's guards into a new `agent/gates.ts` module so
the agent path would be at safety parity with the legacy FSM path. The wrappers were written, exported,
and type-checked — but **never wired into the loop**. `agent/gates.ts` had **zero importers**.

The most important one, `gateBeliefMutation` (wrapping `guardProductMutation`), was the agent-path port
of the engine's product-swap guard. With it dead, any tool that returned a belief with a changed
`activeGoal.productId` — `remove_item`, `adjust_quantity`, `occasion_basket`, `reorder_last` —
committed an off-whitelist product swap unguarded. The FSM path rejects exactly this at
`engine.ts:1472-1488`. **The new path was strictly weaker than the one it parallels.**

Two gate reviewers **APPROVED**. A third, adversarial pass **caught it**.

## The evidence (verbatim from the gate verdicts)

**Wiring Expert — APPROVED.** Its own trace block recorded the dead code as a benign, deferred fact:

> "gates: gates.ts is wired/exported but invoked by the legacy handlers' own guards
> (stock/allergen/calendar/fraud); **runGatesBeforeMutation is reserved for a later seam, not called
> from these wrappers in this slice**."

It *saw* the gates weren't called. It explained it away instead of flagging it. Its own role manual
makes "an exported symbol that is never imported" a **blocking** dead-code finding — and it has a whole
section (4 + 4a) on exactly this. The detection fired; the disposition was wrong.

**Code Reviewer — APPROVED, reviewing the wrong diff.** Its findings were about a *different* change:
the off-topic steer thresholds at `engine.ts:1423`, a `.includes("?")` check, `tenantId` optional in
`ConciergeInput`, and a Levenshtein enum extractor — all artifacts of the **previous** guardrail-
softening PR, not the agent path. Its claim:

> "All mutations (addLine, stock check) are properly gated … gate ordering is correct."

was asserted about the **FSM engine path**, which it had been reading — not about the agent path it was
assigned to review. It rubber-stamped the agent path's gating by pattern-matching "there is a stock
check somewhere," never tracing a mutation on the path under review to its guard.

**Adversarial gate-auditor — REJECTED, with proof.** It ran the grep, traced the actual agent
persistence, and contrasted it against the path being replaced:

> "(c) changing the active product without guardProductMutation — **BYPASSABLE. PROVEN bypass.**
> `handle-inbound-agent.ts:154,157` persists `mutations.belief` directly with NO call to
> `guardProductMutation` or `gateBeliefMutation` anywhere in the agent path. Contrast the legacy engine
> path, which guards the identical mutation at `engine.ts:1472-1488`. `gateBeliefMutation` was written
> to port that guard into the agent path but is never imported or called (grep: agent/gates.ts has zero
> importers)."

It also flagged the qty-aware stock gate as dead (`(a) BYPASSABLE`), and correctly cleared the pay path
(`(b) GATED` — `payHandler` self-enforces amount/slot/calendar/fraud regardless of the dead wrappers).

## Why the two "approving" gates missed it — root causes

### RC1 — Detection without disposition: "deferred" is not a valid disposition for a guardrail
The wiring expert noticed the gates weren't called and filed it as "reserved for a later seam." For a
**guardrail**, "exists but not wired" is worse than "absent" — it reads as protected in code review and
in the file tree, while the runtime path is unprotected. A guard module with zero importers on a path
that replaces a guarded path is a **regression**, full stop. The manual treats dead code as blocking;
it does not say *security/guard* dead code can never be downgraded to a note by rationalizing intent.

### RC2 — No guard-parity check against the path being replaced
This was a **strangler-fig migration**: a new path paralleling an old one. The single highest-value
question for that shape — *"does the new path enforce every guard the old path enforced?"* — was asked
by **no** reviewer except the adversary. The whole defect is a parity gap, and neither standard gate has
a parity dimension. The adversary's winning move was a literal old-vs-new diff (`engine.ts:1472` vs
`handle-inbound-agent.ts:154`). That move must be mandatory, not incidental.

### RC3 — The reviewer never pinned its file list to the actual diff
The code reviewer produced findings about files that were **not in this change**. There is no step that
confronts the reviewer with `git diff --stat` and forces "the files I reviewed == the files that
changed." Without it, a reviewer can review an adjacent or stale change and still emit a confident
APPROVED. This is a silent, total review failure — worse than missing one finding, because *every*
finding is about the wrong code.

### RC4 — A security property was asserted by pattern-match, not by tracing it on the path under review
"All mutations are properly gated" was true of the FSM path and false of the agent path. The reviewer
saw *a* gate and generalized. A safety claim must be proved per-mutation, **on the path under review**:
name the guard that runs immediately before *this* commit, in *this* call chain, or it is a finding.

### RC5 — The gate had no adversary; two "is it correct?" roles are not independent on safety
Both standing reviewers ask "is this correct / wired?" They are correlated — they share the optimistic
frame ("the author meant to wire it; close enough"). The defect was caught only because *this* workflow
added a parallel red-team pass whose job was to **prove a bypass**. The standing dev-team gate protocol
(CTO → Architect → Implementor → Code Reviewer + Wiring Expert) has **no refutation role**. On a
security-relevant change, the absence of an adversary is the bug.

---

## Fixes — make it impossible to miss again

The fixes are concrete edits to the reviewers' operating manuals plus one gate-protocol change. Diffs
below are proposed; landing target to be confirmed (see "Where these land").

### F1 → `claude-skills/code-review/SKILL.md` — strengthen Dimension 8 "Dead Code"
Add, under *Dead Code*:

> - [ ] Is any **guard, gate, validator, or auth/permission check** exported but **never imported**?
>   Grep its importers. A security/guard symbol with **zero importers** on a path that replaces or
>   parallels a guarded path is **BLOCKING (CRITICAL)** — not LOW. "Reserved for a later seam" /
>   "the author will wire it next" is **not** an acceptable disposition: a guard that exists but is
>   not invoked is more dangerous than no guard, because it reads as protected.

### F2 → `claude-skills/code-review/SKILL.md` — new **Dimension 10: Migration & Guardrail Parity**
> Applies whenever a change adds a **new code path that replaces or parallels an existing one**
> (feature-flag dark-ship, strangler-fig, v2 handler, provider switch).
> - [ ] Enumerate every guard/validation the **old path** enforced for the operation (auth, ownership,
>   product/belief guard, stock, rate-limit, idempotency, calendar/fraud).
> - [ ] For **each**, point to the line on the **new path** that enforces the equivalent — *or* mark the
>   new path as a regression. A new path that is **weaker** than the one it replaces is BLOCKING even if
>   every line is individually correct.
> - [ ] Diff the two persistence points old-vs-new (what the old path wrote through a guard, the new
>   path must not write raw).

### F3 → `claude-skills/code-review/SKILL.md` — pin the review to the actual diff (Review Workflow step 1)
> 1. **Scope the change — pinned to the diff.** Run `git diff --stat <base>..<head>` (or read the PR's
>    changed-files list). Your review's file set **must equal** that list. If your findings reference
>    files **not** in the diff, **stop** — you are reviewing the wrong change. State the base/head SHAs
>    in your report so the scope is auditable.

### F4 → `claude-skills/code-review/SKILL.md` — mandatory **Bypass Attempts** output section
> Add to the Output Format, before the Verdict:
> > ### Bypass Attempts
> > For each new or modified mutation/guard, show the call path **entrypoint → guard → commit** on the
> > path under review, or declare it **BYPASSABLE** with file:line. "I didn't find a bypass" is only
> > valid with the trace shown.

### F5 → `agent-team/prompts/wiring_expert.md` — guard-parity + harden dead-code disposition
Add a review dimension:
> ### 7. Guard Parity vs. the Replaced Path
> When the change adds a path that replaces/parallels an existing one, you MUST diff guards old-vs-new.
> List every guard the old path ran for the operation; for each, cite the line on the new path that runs
> it. A guard present on the old path and **absent** on the new path is **blocking** — it is a silent
> regression, the highest-risk class of wiring defect.

Strengthen §4 (Dead Code Detection):
> A guard/gate/validator that is **exported but has zero importers** is **blocking**, never a warning —
> *especially* a security guard. **"Reserved for a later seam" is not an acceptable disposition for a
> guardrail.** Either it is wired on this path now, or this path is weaker than the one it replaces,
> which is a regression you must REJECT. Run the importer grep; do not infer wiring from intent.

### F6 → gate protocol (`team.json` + project `CLAUDE.md` workflow) — require an adversary on safety changes
Two "correctness" reviewers are correlated. For any change touching auth, payments, stock, product/belief
guards, or a new parallel path, the gate must include a **refutation pass** whose deliverable is a *bypass
attempt per mutation/guard* (F4's section). Options: (a) add a standing `red_team` / adversarial role to
the team, or (b) make F4's "Bypass Attempts" section a hard requirement of **both** existing reviewers,
so each must actively try to break the change, not just confirm it. The defect here was caught **only**
because a workflow added (a) ad hoc; we should not rely on remembering to.

## The one-line lesson

> A guard that is written, exported, and type-checked but **never imported** is the most dangerous code
> there is: it makes a regression look like protection. Reviewers must **trace each guard to its call
> site on the path under review** and **diff guards old-path-vs-new-path** — and a security change must
> face an adversary whose job is to prove the bypass, not a second reviewer who confirms correctness.

## Where these land (to confirm with the user)

- **F1–F4** edit `~/sourceControl/claude-skills/code-review/SKILL.md` — the loadable checklist the Code
  Reviewer is told to apply. This file is designed to be extended with incident-informed dimensions; no
  conflict with the "never modify the role prompts" rule.
- **F5** edits `~/sourceControl/claude-teams/agent-team/prompts/wiring_expert.md`, and **F6** touches
  `prompts/code_reviewer.md` / `team.json` / project `CLAUDE.md`. These are the **binding role prompts**,
  which the standing rule marks **"never modify."** They need explicit sign-off before editing.
