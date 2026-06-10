# Methodology — Overview

## Why this exists

Most teams using AI coding agents fall into one of two failure modes:

1. **The black-box mode** — The agent writes code; humans skim and merge. Subtle bugs ship, knowledge doesn't transfer, and review fatigue sets in.
2. **The micromanage mode** — Every step is hand-held. The agent never gets enough context to be useful, and the human spends more time prompting than coding.

This ecosystem is designed to avoid both by making the **pre-work phase first-class**. Every change starts with a written brief, a real domain map, and an approved plan — produced *with* the agent, not *by* the agent — before any code is touched. Implementation, review, and deploy then run against that frozen plan.

## The five stages

```
   1. Intake        2. Research       3. Plan          4. Align         5. Handoff
   ┌────────┐       ┌────────┐        ┌────────┐       ┌────────┐       ┌────────┐
   │ goal,  │  →    │ domain │   →    │ change │   →   │ approve│   →   │ frozen │
   │ scope, │       │ map,   │        │ shape, │       │  or    │       │ plan + │
   │ non-   │       │ reuse, │        │ tests, │       │ revise │       │ tasks  │
   │ goals  │       │ risks  │        │ rollback│      │        │       │        │
   └────────┘       └────────┘        └────────┘       └────────┘       └────────┘
       │                │                  │                │                │
       /intake          /research          /plan            /plan            /plan
                                                            (architect)      (handoff)
```

| # | Stage | Driven by | Output | Living in |
|---|-------|-----------|--------|-----------|
| 1 | Intake | `/intake` *(or `/scope` for fast path)* | Clarified brief — goal, constraints, non-goals, success signal | `docs/plans/<slug>.md` |
| 2 | Research | `/research` *(or `/scope` for fast path)* | Domain map — relevant files, existing utilities to reuse, patterns, risks | Same plan file + `docs/research/<slug>.md` |
| 3 | Plan | `/plan` | Structured plan — files to change, data flow, edge cases, test strategy, rollback | Same plan file |
| 4 | Align | `/plan` (calls `dev-architect`) | APPROVED or REJECTED verdict, with severity-tagged concerns | Same plan file |
| 5 | Handoff | `/plan` final step | Frozen plan + task list ready for the build phase | Same plan file with `status: approved` |

### Fast path: `/scope`

For small, well-named features (clear verb + clear object, single component or feature surface), `/scope` collapses Stages 1+2 into one user round. It auto-reads the target repo (CLAUDE.md, target files, conventions, prior research) BEFORE asking anything, drafts a speculative Brief and Domain Map together, and asks only 1–2 questions on irreducibles (success signal, trigger). Output is a plan file at `stage: research, status: draft` — interchangeable with what `/intake → /research` produces.

Use `/scope` when:
- The request has a concrete verb + object ("add idempotency to webhook handler", "improve order drawer")
- The target repo has a `CLAUDE.md` and recognizable conventions
- The change touches a small surface

Use `/intake → /research` when:
- The request is ambiguous ("improve auth", "make it faster")
- Multiple subsystems are involved
- You want the deliberate two-round flow

`/scope` bails to `/intake` automatically when the request is unsuitable.

The plan file at `docs/plans/<slug>.md` is the single living artifact across all five stages. Each stage appends a section. By the end, it tells the full story: what was asked, what was found, what was decided, and who approved it.

## Operating principles

### 1. No code before approved plan

Implementation skills (build, refactor, test) only run against a plan file with `status: approved`. This is enforced by **convention** in v0.1 — the role prompts and skill instructions check for it; reviewers catch violations. We can graduate to a hard PreToolUse hook later if discipline slips.

### 2. Reuse before invent

The `/research` stage exists to find existing utilities, patterns, and prior plans before proposing new code. New abstractions are flagged in the plan and require explicit justification. Three similar lines is better than a premature abstraction.

### 3. Living documents, archived when done

CLAUDE.md, ADRs, research maps, and plan files are living. They get updated when the code does. After a plan ships, its file is moved to `docs/plans/archive/`, but ADRs and research maps stay where they are — they describe what *is*, not what *was*.

### 4. Human approval is non-negotiable

Advisor-only autonomy: Claude proposes; humans approve every PR, merge, deploy. The architect agent's APPROVED verdict at Stage 4 is necessary but **not sufficient** — the human user must also acknowledge the plan before it's frozen.

### 5. The methodology is software too

These methodology docs are not aspirational essays. They are the canonical reference for the skills under `skills/`. If you change a protocol here, update the matching skill. If you change a skill, update the protocol. They evolve together.

## What's in scope for v0.1

Pre-work phase only — Stages 1 through 5. Build, review, wiring-check, deploy, observability, and CI/CD are deferred to subsequent versions. The existing `/code-review` and `/dev-roles` skills are bundled because they'll be needed downstream, but they're not modified in this pass.

## How to use this folder

- **New to the ecosystem?** Read this file, then `01-intake-protocol.md`. Pick one of the example tasks under `examples/` and walk through it.
- **Authoring a skill?** Read the relevant protocol doc first. Skills must implement the protocol, not invent their own.
- **Joining a team using this?** Make sure the target repo has the artifact folders (`docs/plans/`, `docs/research/`, `docs/adr/`) and a root `CLAUDE.md` derived from `templates/target-repo-CLAUDE.md`.

## Reading order

1. `00-overview.md` (this file)
2. `01-intake-protocol.md` — Stage 1
3. `02-research-protocol.md` — Stage 2
4. `03-planning-protocol.md` — Stage 3
5. `04-alignment-protocol.md` — Stages 4–5
