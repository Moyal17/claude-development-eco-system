# `/run-dev-team` — Skill Overview

A Claude Code skill that runs this team as a **real multi-agent team** (native Claude Code agent teams feature — gated by `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`), instead of the single-context role-switching workflow described in `CLAUDE.md`.

Each role runs in its **own isolated subagent context**. They share a task list, coordinate via DMs, and reviewers run in parallel.

## Where it lives

- Skill: `~/.claude/skills/run-dev-team/SKILL.md`
- Subagent definitions: `~/.claude/agents/dev-cto.md`, `dev-architect.md`, `dev-implementor.md`, `dev-code-reviewer.md`, `dev-wiring-expert.md`
- Canonical prompts (source of truth, unchanged): `~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/*.md`

The subagent files are thin wrappers — they tell each subagent to read its manual from this folder. Edit a prompt here, every future team run picks it up.

## Two ways to use this team

| | Role-switching (default in `CLAUDE.md`) | `/run-dev-team` skill |
|---|---|---|
| Contexts | One — main Claude announces `[ARCHITECT]`, `[IMPLEMENTOR]`, etc. | Five — one per role, isolated |
| Parallelism | Simulated | Real (Code Reviewer + Wiring Expert run concurrently) |
| Cross-consult | Inline reasoning | DM via `SendMessage` to the running Architect |
| Audit trail | In the transcript | Shared task list + structured JSON verdicts |
| Best for | Small / quick work | Bigger tasks, plan-heavy work, or when context bloat matters |

Both paths enforce the same gate protocol and use the same role prompts.

## Modes

| Invocation | Spawns |
|---|---|
| `/run-dev-team <task>` *(default full)* | architect, implementor, code-reviewer, wiring-expert |
| `/run-dev-team plan-only <task>` | architect, implementor — stops at approved plan |
| `/run-dev-team review-only <paths>` | code-reviewer, wiring-expert (parallel) |
| `/run-dev-team architect-consult <question>` | architect alone |
| `/run-dev-team architect,implementor <task>` | any custom subset |

The main Claude acts as CTO / team lead for the duration of the run.

## Lifecycle

1. `TeamCreate` → new team + shared task list at `~/.claude/teams/dev-<id>/`
2. Spawn the required teammates in parallel (single message, multiple `Agent` calls)
3. Decompose into tasks, assign via `TaskUpdate({owner})`
4. Gate protocol: plan approval → implementation → parallel code + wiring review
5. Rejection loop: only the rejecting reviewer re-reviews (max 3 cycles)
6. `TeamDelete` + final summary

## Safety rules

- No self-approval — each gate has its designated authority among the teammates.
- No plan bypass — any mode that includes the Implementor goes through plan approval first.
- No orphan teams — the skill always calls `TeamDelete` on completion or abort.
- Teammates are always addressed by `name`, never `agentId`.

## When to reach for which

- **Quick fix, small PR, conversational work** → stay with role-switching in `CLAUDE.md`.
- **Multi-file feature, ambiguous scope, or you want reviewers working in parallel without context churn** → `/run-dev-team full`.
- **Design spike / proposal only** → `/run-dev-team plan-only`.
- **Post-hoc audit of existing code** → `/run-dev-team review-only <paths>`.
- **Single architectural question** → `/run-dev-team architect-consult <question>`.
