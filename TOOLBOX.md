# Your new toolbox — what it does and how to use it

You now have **6 commands + 4 auto-activating knowledge skills + the unchanged 5-role dev team**. Here's how they map to the work you actually do.

---

## The 4 main scenarios

### 1. Joining a new project (your 2-months-out goal)

**Command:** `/learn`

What happens when you run it:
- Reads README, package files, CI workflows, top-level dirs
- Spawns `dev-explorer` to map the architecture with file:line citations
- Pulls last 10 merged PRs via `gh` to extract real commit/PR/review/test conventions (not what the README *says* — what the team actually *does*)
- Identifies the 15 hottest files by 3-month churn → your "first 2 weeks of reading" list
- Logs every non-obvious thing it spots in `surprises.md`
- Drafts a project-specific `CLAUDE.md` candidate based on everything it learned
- Runs a trust audit (swallowed errors, skipped tests, `any` types, 500-line files)

**Multi-session.** Stop after Phase 3, come back tomorrow, `/learn` resumes from the frontmatter. Run a phase, sleep on it, run the next.

**Read-only.** Only writes to `docs/onboarding/`. You can run it on a repo you don't have write access to.

**Auto-activated alongside it:** `context-engineering` (governs which files to load), `source-driven-development` (prevents hallucinating the unfamiliar stack's APIs).

---

### 2. Building a new feature on a known platform

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

### 3. Hotfix / typo / tiny bug

**Command:** `/quick-fix <bug>`

Compressed flow, single-round gates:
- CTO frames it (8 lines max)
- **Architect + Wiring Expert joint scan** — they pre-trace the blast radius *before* the patch is written, so you know what callers/imports/risks you're touching
- Implementor patches + writes one regression test (mandatory)
- Code Reviewer runs the 9-dim review
- Wiring Expert does a 30-second post-patch re-trace

**Refuses to short-circuit auth/payments/migrations** — it'll output `NEEDS-FULL` and tell you to run `/feature` instead.

No Jira sync, no PR auto-open, no calibration row. Pure speed.

---

### 4. The flexible middle ground

**Command:** `/dev-roles [mode] <task>`

When `/feature` is too heavy (you don't want a Brief, plan file, story-point estimate) but `/quick-fix` is too light (the change has architectural choices to make), use `/dev-roles` with a mode:

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
├── Joining / returning to a repo? ────────────→ /learn
│
├── New feature, multi-file, has a real spec? ──→ /feature
│       └─ skip Jira:            omit --jira
│       └─ no PR yet:             --no-pr
│       └─ skip the Map phase:    --mode=fast
│
├── Hotfix, typo, < 30 lines, obvious cause? ──→ /quick-fix
│       └─ if scan says NEEDS-FULL → use /feature
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
- `/learn` Phase 2 (architecture map) + Phase 5 (hot-spots) gives you a guided reading list grounded in real code, not the README's marketing version
- `surprises.md` is your "weird stuff to remember" log — the things that bite people in week 3
- `source-driven-development` auto-fires whenever you touch the unfamiliar stack, citing official docs so you stop bluffing
- `context-engineering` keeps you focused — the agent loads only what's relevant per task, not the whole codebase

### "Learn new projects fast"
- `/learn` is the structured first 1–2 weeks. Resumable across sessions, multi-pass.
- The candidate `CLAUDE.md` it drafts gives you a concrete artifact — once you adopt it, every future Claude session in that repo starts grounded.
- The conventions doc stops you violating team style on your first PR.
- The trust audit shows you which areas are landmines before you step on them.

### "Work efficiently while learning"
- `/quick-fix` lets you ship small wins from week 1 without ceremony
- `/dev-roles plan-only` lets you propose changes for review without committing — great for "is this the right shape?" conversations with senior teammates
- `/feature` for anything bigger ensures you don't commit to a wrong design — the architect gate catches plan flaws before code is written
- The 5-role gate (especially the Wiring Expert) catches the "I added the function but forgot to register it" class of bug that trips new joiners constantly

### "More than just working — a framework"
- The 3 layers separate **knowledge** (what good looks like — auto-activates), **commands** (what you invoke), and **roles** (who reviews — unchanged).
- Calibration log (`docs/metrics/calibration.tsv`) — every `/done` writes a row. After 10 features you have real velocity data on yourself in this codebase.
- Personal `~/.claude/CLAUDE.md` is your durable preferences file — terse responses, 1 SP = 1 dev-day, ecosystem locations — applies to every session everywhere.

---

## Things to do this week to test it

1. **Try `/learn` against any repo you cloned but never deeply read.** Even a small one. See what `surprises.md` catches.
2. **Run `/quick-fix` on the next typo or 5-line fix** that comes up. Notice how the joint scan changes how you think about the change.
3. **Run `/feature --no-pr <something small>`** end-to-end on a sandbox repo — get the muscle memory for resume + frontmatter + the gate flow before you need it on real work.
4. **Read your new `~/.claude/CLAUDE.md`.** Edit anything that doesn't match how you actually work.

In 2 months when you join the new project, day 1 is `/learn`. Day 2 is `/learn --resume`. Day 5 you've got the architecture map, conventions doc, hot-spots list, and a candidate CLAUDE.md. Day 6 you ship your first `/quick-fix`. Week 2 you ship your first `/feature`. The framework runs the process so you can spend your attention on the domain.
