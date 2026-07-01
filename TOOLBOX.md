# Your new toolbox — what it does and how to use it

You now have **4 commands + 4 auto-activating knowledge skills + the unchanged 5-role dev team**. Here's how they map to the work you actually do.

---

## The 2 main scenarios

### 1. Building a new feature on a known platform

**Command:** `/feature <description>`

One invocation drives 7 internal phases:
- **A — Frame:** Brief (auto-decides scope-style vs intake-style based on description clarity)
- **B — Map:** Domain Map via `dev-explorer`
- **C — Plan:** Plan + estimate (1 SP = 1 dev-day) + Architect approval gate (3-cycle cap)
- **D — Branch + Sync:** `plan/<slug>` branch, optional `--jira KEY` sync to Jira
- **E — Build:** 5-role gate — CTO → Architect → Implementor → Code Reviewer → Wiring Expert (the unchanged role prompts)
- **F — Ship:** Local quality gate (test/build/typecheck/lint), push, open PR, Jira → In Review
- **G — Address review:** Fetch PR comments, picker, fix, push

**Resumable.** Stop after any phase, run `/feature --resume <slug>`, picks up from frontmatter.

**Flags:**
- `--jira KEY` — opt-in Jira sync (omit and Jira phases skip silently)
- `--no-pr` — stop after Phase E, leave commit local
- `--mode=fast` — skip Phase B (Map) for very small features

**Auto-activated inside:** `incremental-implementation` (Phase E enforces ~100-line slices), `debugging-and-error-recovery` (when builds fail), `context-engineering`, `source-driven-development`.

---

### 2. The flexible middle ground

**Command:** `/dev-roles [mode] <task>`

When `/feature` is too heavy (you don't want a Brief, plan file, story-point estimate) but the change still has architectural choices to make, use `/dev-roles` with a mode:

- `/dev-roles plan-only <task>` — design only, stop at approved plan, no code
- `/dev-roles review-only src/auth/` — audit existing code, no changes
- `/dev-roles architect-consult <question>` — one architectural question, one focused answer
- `/dev-roles full <task>` — full 5-role gate, no Jira/PR ceremony around it
- `/dev-roles architect,implementor <task>` — custom subset

This is your **escape hatch** when the canonical paths don't fit.

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
├── New feature, multi-file, has a real spec? ──→ /feature
│       └─ skip Jira:            omit --jira
│       └─ no PR yet:             --no-pr
│       └─ skip the Map phase:    --mode=fast
│
├── Architecture question / spec only / audit? → /dev-roles <mode>
│
├── Just want a 9-dim diff review? ────────────→ /code-review
│
└── PR merged, time to close out? ─────────────→ /done <slug>
```

---

## How this helps with the specific things you mentioned

### "Understand an unfamiliar domain"
- `source-driven-development` auto-fires whenever you touch the unfamiliar stack, citing official docs so you stop bluffing
- `context-engineering` keeps you focused — the agent loads only what's relevant per task, not the whole codebase

### "Work efficiently while learning"
- `/dev-roles plan-only` lets you propose changes for review without committing — great for "is this the right shape?" conversations with senior teammates
- `/feature` for anything bigger ensures you don't commit to a wrong design — the architect gate catches plan flaws before code is written
- The 5-role gate (especially the Wiring Expert) catches the "I added the function but forgot to register it" class of bug that trips new joiners constantly

### "More than just working — a framework"
- The 3 layers separate **knowledge** (what good looks like — auto-activates), **commands** (what you invoke), and **roles** (who reviews — unchanged).
- Calibration log (`docs/metrics/calibration.tsv`) — every `/done` writes a row. After 10 features you have real velocity data on yourself in this codebase.
- Personal `~/.claude/CLAUDE.md` is your durable preferences file — terse responses, 1 SP = 1 dev-day, ecosystem locations — applies to every session everywhere.

---

## Things to do this week to test it

1. **Run `/feature --no-pr <something small>`** end-to-end on a sandbox repo — get the muscle memory for resume + frontmatter + the gate flow before you need it on real work.
2. **Read your new `~/.claude/CLAUDE.md`.** Edit anything that doesn't match how you actually work.
