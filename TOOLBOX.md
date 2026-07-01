# Your new toolbox — what it does and how to use it

You now have **4 commands + 4 auto-activating knowledge skills + the unchanged 5-role dev team**. Here's how they map to the work you actually do.

---

## The 2 main scenarios

### 1. Role-gated change — single context

**Command:** `/dev-roles [mode] <task>`

Runs the 5-role gate (CTO → Architect → Implementor → Code Reviewer → Wiring Expert) in one context, with mode flags:

- `/dev-roles plan-only <task>` — design only, stop at approved plan, no code
- `/dev-roles review-only src/auth/` — audit existing code, no changes
- `/dev-roles architect-consult <question>` — one architectural question, one focused answer
- `/dev-roles full <task>` — full 5-role gate
- `/dev-roles architect,implementor <task>` — custom subset

**Auto-activated inside:** `incremental-implementation` (Build enforces ~100-line slices), `debugging-and-error-recovery` (when builds fail), `context-engineering`, `source-driven-development`.

---

### 2. Multi-agent team — isolated contexts

**Command:** `/run-dev-team <task>`

Same 5 role prompts, but spawned as separate subagents sharing a task list, running in parallel where the workflow allows (Code Reviewer + Wiring Expert concurrently). Use when the task is big enough that role isolation and parallel review pay off. `/dev-roles` is the lightweight single-context version of the same gate.

---

## The 4 knowledge skills (auto-activate, never invoke)

These fire on activity. You don't think about them. They make every other skill better.

| Skill | When it kicks in | What it does |
|---|---|---|
| **context-engineering** | New session, output drift, switching tasks | Picks the right files, applies trust levels, prevents context flooding |
| **incremental-implementation** | About to write > 100 lines without testing | Forces vertical slices, test-after-each, scope discipline |
| **debugging-and-error-recovery** | Test fails, build breaks, unexpected behavior | 6-step triage: Reproduce → Localize → Reduce → Fix → Guard → Verify (no guessing) |
| **source-driven-development** | Framework decision, library API question | Cites official docs, flags unverified, no API hallucination |

The biggest win for your unfamiliar-domain scenario: `source-driven-development` stops the agent from inventing API shapes from stale training data. `context-engineering` stops it from loading the wrong 5,000 lines.

---

## Decision flowchart for your day-to-day

```
What are you trying to do?
│
├── Change that needs the role gate, one context? → /dev-roles <mode>
│       └─ design only:   plan-only
│       └─ audit only:    review-only
│       └─ one question:  architect-consult
│
├── Bigger task, want parallel isolated reviewers? → /run-dev-team
│
└── Just want a 9-dim diff review? ───────────────→ /code-review
```

---

## How this helps with the specific things you mentioned

### "Understand an unfamiliar domain"
- `source-driven-development` auto-fires whenever you touch the unfamiliar stack, citing official docs so you stop bluffing
- `context-engineering` keeps you focused — the agent loads only what's relevant per task, not the whole codebase

### "Work efficiently while learning"
- `/dev-roles plan-only` lets you propose changes for review without committing — great for "is this the right shape?" conversations with senior teammates
- `/dev-roles full` or `/run-dev-team` for anything bigger ensures you don't commit to a wrong design — the architect gate catches plan flaws before code is written
- The 5-role gate (especially the Wiring Expert) catches the "I added the function but forgot to register it" class of bug that trips new joiners constantly

### "More than just working — a framework"
- The 3 layers separate **knowledge** (what good looks like — auto-activates), **commands** (what you invoke), and **roles** (who reviews — unchanged).
- Personal `~/.claude/CLAUDE.md` is your durable preferences file — terse responses, 1 SP = 1 dev-day, ecosystem locations — applies to every session everywhere.

---

## Things to do this week to test it

1. **Run `/dev-roles full <something small>`** end-to-end on a sandbox repo — get the muscle memory for the gate flow before you need it on real work.
2. **Read your new `~/.claude/CLAUDE.md`.** Edit anything that doesn't match how you actually work.
