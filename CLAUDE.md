# claude-development-eco-system — instructions for Claude

You are operating inside the **claude-development-eco-system** toolkit. The user is building or maintaining a self-contained Claude Code ecosystem for dev teams.

## Structure (3 layers)

**Layer 1 — Knowledge skills** (auto-activate, no slash command). Live under `skills/knowledge/`. Edit them when refining auto-activation triggers, anti-rationalization tables, or composition guidance with the rest of the eco-system.
- `context-engineering` — what to load, when, trust levels
- `incremental-implementation` — vertical slices, ~100 lines max
- `debugging-and-error-recovery` — Reproduce → Localize → Reduce → Fix → Guard → Verify
- `source-driven-development` — cite official docs

**Layer 2 — Explicit commands** (4 total). Each has its own folder under `skills/`.
- `dev-roles/` — manual role-switching workflow with mode flags
- `run-dev-team/` — multi-agent team orchestration (native Claude Code teams) of the same role prompts
- `code-review/` — standalone 9-dim review
- `ui-ux-pro-max/` — UI/UX design intelligence (styles, palettes, fonts, stacks)

**Layer 3 — Dev team roles** at `~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/`. **NEVER MODIFIED** by any skill in this eco-system. They are the binding contract for `/dev-roles` and `/run-dev-team`.

## What this folder is

A git-shareable toolkit of skills, agents, hooks, methodology docs, and templates. It is the **source of truth** for system-level Claude assets in this user's environment. Files under `~/.claude/` (skills, agents) are derived — symlinked or copied via `install.sh`. Personal `~/.claude/CLAUDE.md` is copied from `templates/personal-claude-md.template` on first install (never overwritten).

## Where to make changes

- **Edit here, not in `~/.claude/`.** Anything you change inside `~/.claude/skills/` or `~/.claude/agents/` will be overwritten on the next `install.sh` run. Always edit the source under `~/sourceControl/claude-development-eco-system/` and re-run install if needed.
- **Per-task artifacts (plans, ADRs, research) belong in the target repo** — not here. This folder ships *templates* under `templates/`, not actual content.

## Operating principles (the team's rules)

1. **No code before approved plan.** The pre-work loop (`/intake` → `/research` → `/plan`) ends with an explicitly approved plan. Implementation skills only run against an approved plan file.
2. **Advisor-only autonomy.** Claude proposes; humans approve every PR, merge, deploy. No autonomous merges, no autonomous deploys, no force pushes.
3. **Soft gates by convention.** No blocking PreToolUse hook. Discipline lives in the skills, the role prompts, and the reviewers — not in tool-level enforcement.
4. **Reuse before invent.** Every skill and agent should look for existing utilities, patterns, and prior plans before proposing new code or new abstractions. The `/research` stage exists to make this systematic.
5. **Living documents.** CLAUDE.md, ADRs, research maps, and plan files all evolve. Update them when something changes; archive when work is done.

## Stack assumptions

Primary targets are **Node/TypeScript** (backend + React/Next) and **Python** (services / data / ML). Hooks and templates are written for both. When extending to other stacks, mirror the existing pattern rather than special-casing.

## Methodology

The full methodology lives in `methodology/`. Read `methodology/00-overview.md` first if you're unfamiliar with the five stages (Intake, Research, Plan, Align, Handoff).

## Updating this ecosystem

When the user asks to add or change a skill, agent, hook, or methodology doc:

1. Edit the source file under this folder.
2. If it's a new skill or agent, run (or remind the user to run) `./install.sh` to symlink it.
3. Bump the version in `VERSION` for any user-visible change.
4. If the change affects the methodology, update the matching `methodology/*.md` doc — the methodology and the skills must stay in sync.

## What NOT to do

- Don't write `README.md` inside skill folders — skills use `SKILL.md` plus optional `references/`. (See the Anthropic skills guide.)
- Don't add Claude/Anthropic-prefixed names to skills — those are reserved.
- Don't introduce CI/CD, deploy, or production-touching skills until the user explicitly opens that phase. The current scope is pre-work only.
