# Methodology — Research Protocol (Stage 2)

## Purpose

Build a structured **domain map** of the parts of the codebase relevant to the brief — including what already exists that can be reused, what patterns the team follows, and where the risks live. Research is read-only; nothing is written to source files in this stage.

A good domain map shortens the plan, prevents reinvention, and gives a new dev real understanding instead of an AI summary they don't trust.

## Inputs

- An approved Stage 1 brief in `docs/plans/<slug>.md`.
- Read access to the target repo, prior research maps under `docs/research/`, prior plans under `docs/plans/archive/`, and any referenced ADRs.

## Output

A `## Domain Map` section appended to `docs/plans/<slug>.md`, plus optionally a durable copy at `docs/research/<slug>.md` if the map is reusable beyond this plan.

Frontmatter advances to `stage: research, status: draft`.

### Domain Map shape

```markdown
## Domain Map

### Entry points
<which routes / handlers / CLI commands / events are involved? file:line for each>

### Affected components
<for each one: path, one-line role, why it matters for this plan>

### Existing utilities to reuse
<concrete: file:line, function name, what it does. Be specific — "validateInput in src/util/validate.ts:42 already does X" beats "there's some validation utility">

### Patterns the team follows here
<error handling style, testing convention, logging shape, naming — observed from existing code, not invented>

### Data flow (current state)
<short prose or ASCII diagram tracing input → output through the components above>

### Risk surface
<each risk has: what could go wrong, where (file:line), and the blast radius>

### What surprised me
<things that didn't match the brief's assumptions; things that contradict prior research; things future-you will want to remember>

### Out-of-scope-but-touched
<files the plan will read but not modify, services the plan will call but not change>

### Open questions for /plan
<things still unclear; explicit pointers for the planning stage>
```

## How to scout (the workflow)

### Before searching

Re-read the brief. The Goal sentence dictates the search axes; Non-goals tell you what to skip. If the brief says "auth is out of scope," don't map the auth module just because it's adjacent.

### Search strategy

1. **Entry points first.** What does the user/system actually call? Find the route, handler, command, or event that triggers the behavior in question. Anchor everything else off that.
2. **Trace, don't sample.** Follow imports and calls from the entry point outward until you hit a system boundary (DB, external API, file system, queue). Don't grep for keywords and call it a map — that misses dependencies and produces incomplete pictures.
3. **Look for the same problem already solved.** Grep for the verbs in the goal (`idempotent`, `dedupe`, `retry`, `cache`). Almost always something close exists; reuse beats reinvention.
4. **Check `docs/research/INDEX.md` and `docs/plans/archive/`.** Prior plans on adjacent code are the highest-signal context — and they tell you what didn't work.
5. **Read the test files.** They reveal the contract more honestly than the implementation. Note any tests you'll need to update or add.

### Use the dev-explorer subagent for breadth, your own tools for depth

- For "where do all the X live?" or "is this pattern used elsewhere?" — spawn `dev-explorer`. Returns a structured map without polluting the main context.
- For tracing one specific path or reading one critical file end-to-end — do it yourself. Don't delegate the deep read.
- Up to 3 explorers in parallel for genuinely independent questions; usually 1 is enough.

### When to stop

Stop when **all** of these are true:
- You can name the file and function for every entry point and every component the plan will modify.
- You've identified at least one existing utility to reuse, OR you've explicitly checked and confirmed nothing reusable exists.
- You've answered every Open Question from the brief, or escalated unanswerable ones.
- The risk surface lists at least one concrete risk (no plan is risk-free; saying "no risks" means you didn't look).

Don't keep researching past this. The point of stopping is so the plan can absorb what you found while it's fresh.

## What goes in `docs/research/<slug>.md` vs. just the plan file

**Copy to `docs/research/<slug>.md`** when:
- The map will be useful to *future* plans, not just this one (e.g., a thorough map of the auth module is reusable; a map of one specific endpoint isn't).
- The map describes a subsystem more comprehensively than the current plan needs.

When you copy, also append an entry to `docs/research/INDEX.md` with the slug, date, and one-line summary.

**Stay in the plan file only** when the map is narrowly task-specific.

## Anti-patterns

- **Greenfield assumptions in a retrofit.** The brief is for an existing repo; don't propose patterns that conflict with what's there. If you think the existing pattern is wrong, flag it under "What surprised me" — don't silently override it.
- **Map without file:line citations.** A claim like "we have caching somewhere" is useless. Cite or omit.
- **Skipping the surprise section.** "What surprised me" is the highest-signal section for the planner. If nothing surprised you, you didn't look hard enough or the task is genuinely trivial — say so explicitly.
- **Inventing patterns.** The "Patterns the team follows here" section is observed, not aspirational. If the team's pattern is bad, say so under risks; don't quietly write a different one into the plan.
- **Reading everything.** Time-box. A complete-but-shallow map beats an exhaustive-but-half-finished one.

## Handoff to Stage 3 (Plan)

The Domain Map is complete when all sections are populated, every component has a file:line citation, and the Open Questions for `/plan` are either resolved or explicitly flagged. Frontmatter is bumped to `stage: research, status: draft`.

`/plan` reads the brief AND the domain map. If the map says "X already exists at Y," the plan must reuse X or justify why it doesn't.
