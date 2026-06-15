# claude-development-eco-system

A self-contained Claude Code toolkit — skills, agent definitions, and team configs — managed as a single git repo. Clone once, run `install.sh`, and every tool is live via symlinks in `~/.claude/`.

```bash
git clone <this-repo> ~/sourceControl/claude-development-eco-system
cd ~/sourceControl/claude-development-eco-system && ./install.sh
```

---

## Skills (`skills/`)

### Active commands (invoke with `/skill-name`)

| Skill | What it does |
|---|---|
| `/dev-roles` | Run the full Elite Engineering Team workflow in one context — Claude plays CTO → Architect → Implementor → Code Reviewer → Wiring Expert sequentially, enforcing the full gate protocol (plan approval → code review → wiring review). Supports partial modes: `plan-only`, `review-only`, `architect-consult`, custom role subsets. Most-used skill in the ecosystem. |
| `/run-dev-team` | Same gate workflow, but spawns each role as a real independent subagent (native Claude Code teams). Architect and reviewers run in parallel with isolated contexts. Use for large tasks or when the main context is already heavy. |
| `/code-review` | Standalone 9-dimension production-quality code review: auth/authz, injection, concurrency, data integrity, error handling, API design, cryptography, type safety, test coverage. Pass `--fix` to auto-apply findings or `--comment` to post as inline PR comments. |
| `/ui-ux-pro-max` | UI/UX design intelligence — 67 styles, 96 palettes, 57 font pairings, 25 chart types, 13 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Covers design, build, review, and improve actions for any UI artifact. |
| `/remotion` | Remotion video composition reference — rules for animations, timing, sequencing, text effects, transitions, audio, captions, 3D, fonts, charts, Lottie, maps, and more. Load the relevant rule file on demand for the task at hand. |
| `/lighthouse` | Lighthouse CI setup and performance diagnosis for Vite/React SPAs. Covers render-blocking fonts, LCP/hero image fixes, JS bundle splitting, RTL screenshot testing. |
| `/react-refactor` | React component refactoring guidance — patterns for splitting large components, extracting hooks, simplifying state, and aligning with project conventions. |
| `/remotion-product-demo` | Remotion-specific workflow for building product demo videos — scene structure, timing, branding, and delivery checklist. |
| `/team-builder` | Build and configure Claude Code agent teams — define roles, write prompts, wire team.json, and scaffold the folder structure. |
| `/product-research-team` | Run the full product research workflow using the Elite Product Research Team — CPO decomposes brief, two researchers investigate in parallel, two PMs synthesize into a CPO-approved requirements doc. |
| `/learn` | Multi-session codebase onboarding. Builds a personal architecture map, extracts conventions from recent merged PRs, identifies hot-spot files, drafts a project-specific CLAUDE.md. Resumable across sessions. |
| `/done` | Close-out a finished task — stamps `done_at` + `actual_hours`, appends a calibration row to the per-repo velocity log, archives the plan file. |
| `/feature` | End-to-end feature loop (phases Frame → Map → Plan → Branch → Build → Ship → Review). Drives the 5-role gate workflow internally. Supports `--jira`, `--no-pr`, `--resume`. |
| `/quick-fix` | Compressed hotfix path — CTO → joint Architect+Wiring scan → Implementor → Code Reviewer. Single-round gates, no Jira, no PR auto-open. Bails to `/dev-roles` if the scan shows bigger scope. |
| `/task-timing` | Auto-fires alongside any skill that drives `TaskCreate`/`TaskUpdate`. Stamps start/end on every gate transition, emits a markdown timing table (task → elapsed → estimate vs actual) at workflow end. |
| HeyGen skills | Multi-skill library for HeyGen AI video — prompt-based creation, avatar/scene control (v2 API), visual-style design systems, TTS audio, video translation. Loaded via `@`-include in `~/sourceControl/CLAUDE.md`; individual sub-skills at `skills/heygen/skills/*/SKILL.md`. |

### NotebookLM presentation skills (`skills/notebooklm/`)

These fire when explicitly invoked via `/nlm-*`. Focused on turning research or content into polished NotebookLM artifacts.

| Skill | What it does |
|---|---|
| `/nlm-deck` | Build a slide deck in NotebookLM from source material — structures content into sections, writes slide copy, and exports. |
| `/nlm-infographic` | Generate a visual infographic from research or notes — key stats, flow diagrams, visual summaries. |
| `/nlm-source-prep` | Prepare and format raw sources for NotebookLM ingestion — cleans, structures, and deduplicates before upload. |
| `/nlm-video` | Create a video script and storyboard from NotebookLM content — narration, scene cues, timing. |

---

### Auto-activating knowledge skills (`skills/knowledge/`)

These load automatically — no slash command needed. They fire when the situation matches their trigger conditions and compose with the active command skills above.

| Skill | When it fires | What it enforces |
|---|---|---|
| `context-engineering` | Starting an unfamiliar repo; agent output quality degrading; switching major subsystems | Optimizes what gets loaded into context, when, and at what trust level |
| `debugging-and-error-recovery` | Tests fail; build breaks; runtime mismatch; error in logs | Reproduce → Localize → Reduce → Fix → Guard → Verify (no guessing) |
| `incremental-implementation` | Any change touching >1 file; about to write >100 lines; Implementor phase active | Enforces thin vertical slices (~100 lines max), test after each slice |
| `source-driven-development` | About to write framework-specific code; library API question; version-specific behavior matters | Grounds every framework decision in official docs before writing |

---

## Agent Definitions (`agents/`)

Independent subagent personalities, each with specific tool access and gate authority. Used directly by `/run-dev-team`; the prompts they point to also drive `/dev-roles` role-switching.

| Agent | Role | Gate authority |
|---|---|---|
| `dev-cto` | Orchestrates work — decomposes, assigns, enforces gates, closes tasks only after full audit trail | — |
| `dev-architect` | Reviews implementation plans before any code is written | `plan_approval` |
| `dev-implementor` | Explores codebase → writes plan → implements → submits for review | — |
| `dev-code-reviewer` | 9-dimension code review (correctness, security, tests, maintainability) | `code_review_approval` |
| `dev-wiring-expert` | End-to-end trace from entrypoint to terminal effect; catches dead code, missing imports, regressions | `wiring_approval` |
| `dev-explorer` | Read-only codebase scout — maps entry points, components, utilities, patterns. Used in research/planning phases | — |
| `dev-intake` | Clarification interviewer — turns vague requests into a written Brief before planning begins | — |

---

## Agent Teams (`teams/`)

Full team configs (roles, prompts, gate workflows, tool schemas). The binding role prompts that all dev skills reference live in `teams/agent-team/prompts/`.

| Team | Purpose |
|---|---|
| `agent-team` | Elite Engineering Team — CTO, Architect, Implementor(s), Code Reviewer, Wiring Expert. Source of truth for all 5 role prompts. Canonical gate spec in `team.json`. |
| `marketing-team` | TransVibe content and brand team — CMO, Growth Marketer, Brand Marketer, Content Writer, Storytelling Architect. Discovery-first workflow, no content ships without CMO approval. |
| `product-research-team` | CPO-led research workflow — two parallel researchers (journey + edge cases), two PMs synthesize into a requirements doc, CPO approves before handoff to engineering. |
| `recon-team` | Intelligence-gathering team for competitive research, market mapping, and signal collection. |

---

## External Tools & Plugins

### Caveman Mode — token-efficient communication
**Repo:** [https://github.com/juliusbrussee/caveman](https://github.com/juliusbrussee/caveman)

Caveman is a Claude Code skill that cuts input/output token usage ~75% by dropping articles, filler words, pleasantries, and hedging while keeping full technical accuracy. Fragments are fine. Code blocks are always normal.

**Benefits:**
- Longer sessions before context limit — same work, fewer tokens consumed per turn
- Faster responses — less output generated, less noise to read through
- Intensity levels: `lite`, `full` (default), `ultra`
- Auto-activates on `/caveman` or phrases like "less tokens" / "be brief"
- Includes `cavecrew` subagents (investigator, builder, reviewer) that return caveman-compressed results, keeping ~60% fewer tokens injected back into main context

Install: add as a Claude Code plugin, or drop the skill folder into your `~/.claude/skills/` directory.

---

### JFrog Boost — dependency intelligence
**Link:** [https://boost.jfrog.com/](https://boost.jfrog.com/)

JFrog Boost surfaces security vulnerabilities, license risks, and version intelligence for your project's dependencies — directly inside your development workflow.

**How it works:**
- Scans `package.json`, `requirements.txt`, `go.mod`, and other dependency manifests
- Cross-references against JFrog's security database (CVEs, malicious packages, license violations)
- Integrates into Claude Code via MCP — query package risk without leaving your editor
- Returns severity-tagged findings (Critical / High / Medium / Low) with remediation guidance

**Benefits:**
- Catch vulnerable or malicious packages before they ship
- License compliance checks built in (GPL contamination, commercial restrictions)
- No separate CI step needed — risk signal available at planning and code-review time
- Works across npm, PyPI, Go, Maven, NuGet

---

### NotebookLM MCP — drive NotebookLM from Claude
**Repo:** [https://github.com/jacob-bd/notebooklm-mcp-cli](https://github.com/jacob-bd/notebooklm-mcp-cli)

An MCP server (+ `nlm` CLI) that exposes Google NotebookLM (notebooklm.google.com) to Claude Code. It powers the `/nlm-*` presentation skills above — notebook/source/studio management, audio/video/infographic/slide generation, research import, and sharing — via `mcp__notebooklm__*` tools.

**What it provides:**
- MCP server binary `notebooklm-mcp` (registered as the `notebooklm` server) and the `nlm` CLI
- Tools: `notebook_create`, `source_add`, `studio_create`, `download_artifact`, `research_start`, `note_*`, `notebook_share_*`, and more
- Browser-cookie auth against your real Google account — no API key

**Connect guide:** see [`skills/notebooklm/CONNECT.md`](skills/notebooklm/CONNECT.md) for the exact install + auth steps used in this environment.

---

## Bootstrap

```bash
# New machine setup
git clone <this-repo> ~/sourceControl/claude-development-eco-system
cd ~/sourceControl/claude-development-eco-system && ./install.sh

# What install.sh does:
# - Symlinks each skill dir  -> ~/.claude/skills/
# - Symlinks each agent .md  -> ~/.claude/agents/
# - Symlinks ~/sourceControl/claude-teams -> teams/  (keeps hardcoded role-prompt paths alive)
# - Symlinks ~/sourceControl/claude-skills/{code-review/SKILL.md,heygen,lighthouse,remotion} -> skills/ (legacy paths kept alive)
# - Never overwrites your existing ~/.claude/CLAUDE.md
```

---

## Editing

**Edit source files here, never the symlink targets.**

`~/.claude/skills/` and `~/.claude/agents/` are derived — any change there gets overwritten on the next `install.sh` run. Always edit under `~/sourceControl/claude-development-eco-system/`, then re-run `install.sh` if you added new skill/agent directories.
