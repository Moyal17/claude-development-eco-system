# Build Summary — claude-development-eco-system

## v0.3.0 — 3-layer restructure

**Why.** v0.2's 11-stage linear pipeline forced ceremony onto small work and offered no domain knowledge depth. After analyzing `addyosmani/agent-skills` (auto-activating skill toolbox with anti-rationalization tables) and the user's near-term goal of joining a new project in 2 months, restructured into 3 layers.

**What changed.**

| Change | Detail |
|---|---|
| Removed 8 legacy commands | `/intake`, `/scope`, `/research`, `/plan`, `/jira-sync`, `/start-dev`, `/ready-for-review`, `/address-review` — folded into `/feature` (internal phases A–G) and **deleted entirely**, no archive folder kept. |
| Kept `/dev-roles` | Standalone manual role-switching workflow with mode flags (`full`, `plan-only`, `review-only`, `architect-consult`, custom subset). The flexible middle-ground between `/quick-fix` and `/feature`. |
| Kept `/code-review` | Standalone 9-dim diff review. The eco-system version is now the authoritative copy at `~/.claude/skills/code-review` (replacing the prior independent folder). |
| New `/learn` | Multi-session onboarding skill. Builds architecture map, extracts conventions from PRs, identifies hot-spots, drafts project CLAUDE.md, runs trust audit. Read-only. |
| New `/feature` | End-to-end loop in one command. Resume via `--resume <slug>` (state in plan-file frontmatter). Flags: `--jira KEY`, `--no-pr`, `--mode=fast`. |
| Knowledge skills | Ported 4 from addyosmani: `context-engineering`, `incremental-implementation`, `debugging-and-error-recovery`, `source-driven-development`. Auto-activate, no slash command. Live under `skills/knowledge/`. |
| Personal CLAUDE.md | New `templates/personal-claude-md.template` → installed to `~/.claude/CLAUDE.md` (only if missing). Captures durable working-style preferences. |
| Installer | `install.sh` symlinks 6 active skills + 4 knowledge skills + agents, copies personal CLAUDE.md only if absent. |
| Dev team roles | **UNCHANGED.** All 5 prompts at `~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/` remain the binding contract. Per user constraint. |
| Methodology docs | Unchanged. The WHY behind each stage is still valid; only the command surface collapsed. |

**Active skills (6 commands + 4 knowledge):**
- Commands: `/learn`, `/feature`, `/quick-fix`, `/dev-roles`, `/code-review`, `/done`
- Knowledge (auto-activating): `context-engineering`, `incremental-implementation`, `debugging-and-error-recovery`, `source-driven-development`

**Removed (deleted, not archived):** intake, scope, research, plan, jira-sync, start-dev, ready-for-review, address-review. Their logic lives inside `/feature` Phases A–G.

---

# Build Summary — claude-development-eco-system v0.2.0

A self-contained, opinionated Claude Code toolkit covering the full lifecycle of a dev task: from raw user request → committed code → merged PR → ticket transitioned to Done → calibration data captured for future estimation. Lives at `~/sourceControl/claude-development-eco-system/`, ships skills, agents, GHA templates, methodology docs, and per-repo templates.

## The full loop (10 stages)

```
 1. /intake           Brief: goal, constraints, non-goals, success signal
   └─or─
 1. /scope            Fast-path: collapses intake + research for small features
 2. /research         Domain Map: file:line citations, risks, surprises
 3. /plan             Plan + Architect approval gate + user ack + frozen plan
 4. /jira-sync        Push curated subset to Jira ticket; transition To Do → In Progress
 5. /start-dev        Create plan/<slug> branch, stamp started_at  ← clock starts
 6. /dev-roles        CTO → Architect → Implementor → Reviewer → Wiring (gate protocol)
 7. /ready-for-review Local test/lint gate → push branch → open PR → Jira → In Review
 8. (GHA fires)       claude-pr-review.yml runs Claude on the diff, posts findings
 9. /address-review   Fetch findings, fix selected, commit, push (re-trigger GHA)
10. (merge PR)        jira-on-merge.yml transitions ticket → Done
11. /done             Stamp done_at + actual_hours, write calibration row, archive plan
```

## What's in the box

### Skills (11 total — all under `skills/`)

| Skill | Stage | Purpose |
|-------|-------|---------|
| `/scope` | 1 (fast) | Auto-reads repo, drafts speculative Brief + Domain Map together, asks 1–2 anchored questions on irreducibles. Bails to `/intake` when ambiguous. |
| `/intake` | 1 | Structured Brief: goal, why-now, constraints, non-goals, observable success signal, stakeholders. Up to 4 questions per round. Detects oversized requests and proposes decomposition. |
| `/research` | 2 | Spawns `dev-explorer` (and parallel `Explore` agents). Domain Map with file:line citations, "What surprised me", optional durable copy at `docs/research/<slug>.md`. |
| `/plan` | 3 | Drafts Plan (Approach / Files / Edge cases / Tests / Rollback / Risks / **Estimate** with per-task hours + story points). Architect review with severity-tagged concerns (BLOCKER/WARNING/SUGGESTION). User ack via picker (silence ≠ approval). 3-cycle rejection cap. |
| `/jira-sync` | 4 | Pushes curated subset (Brief + Approach + Tasks + plan link) as real ADF (proper headings, taskLists, code blocks). Auto-transitions To Do → In Progress on first sync. `--target-status` for arbitrary transitions. |
| `/start-dev` | 5 | **NEW v0.2** — Pre-flights uncommitted changes, syncs `main`, creates `plan/<slug>` branch, stamps `started_at` at the *real* moment work begins (not at plan approval). |
| `/dev-roles` | 6 | Plays every team role in one context with `[CTO]` / `[ARCHITECT]` / `[IMPLEMENTOR]` / `[CODE REVIEWER]` / `[WIRING EXPERT]` announcements. Enforces gate protocol. Modes: `full`, `plan-only`, `review-only`, `architect-consult`. |
| `/code-review` | (called by 6) | Production-incident-informed expert review across 9 dimensions: auth/authz, injection, concurrency, data integrity, error handling, API design, crypto, types, testing. |
| `/ready-for-review` | 7 | **NEW v0.2 gate** — Pre-flight refuses uncommitted/`main`/no-`gh`/`status: draft`. **Local quality gate**: detects stack and runs `npm test`/`pytest -q`/`cargo test`/`go test ./...` plus `typecheck`/`lint`. `--skip-checks` to bypass (logged in summary). Pushes branch, opens PR with body curated from plan (Summary + Files-changed + Plan-source link + Architect/Wiring verdicts + structured `Jira-Ticket: <KEY>`), transitions Jira → In Review. |
| `/address-review` | 9 | **NEW v0.2** — Fetches PR comments via `gh`, parses Claude PR review GHA's `## Findings` section into structured items (severity / file:line / issue / fix). Picker: address all / address selected / skip-with-rationale (posts rationale to PR) / cancel. Per-fix workflow: read context → surgical Edit → run tests → commit → push. Refuses on merged/closed PRs. |
| `/done` | 11 | Refuses non-approved/already-closed plans. Computes `actual_hours` (wall-clock from `started_at` or `--actual-hours` override) and `accuracy_ratio = actual / estimate`. Stamps `done_at`/`actual_hours`/`status: shipped` into frontmatter. Appends row to `docs/metrics/calibration.tsv` (append-only). **NEW v0.2:** archives plan via `git mv docs/plans/<slug>.md docs/plans/archive/<slug>.md` (`--no-archive` to opt out). |

### Agents (7 total — under `agents/`)

| Agent | Role |
|-------|------|
| `dev-cto` | Decomposes user requests into tasks with acceptance criteria. Closes tasks only after full gate audit trail. |
| `dev-architect` | Plan-approval gate authority. Severity-tagged verdicts. Available for cross-consultation mid-task. |
| `dev-implementor` | Writes plans for architect approval, then implements exactly what was approved. Cross-consults on architectural ambiguity. Phase 5b: must resolve all warnings before TASK_DONE. |
| `dev-code-reviewer` | Code-review-approval gate. Reviews against the 9-dimension checklist (`code-review` skill). |
| `dev-wiring-expert` | Wiring-approval gate. Traces every feature entrypoint → terminal effect. Catches dead code, missing imports, missing registrations. |
| `dev-explorer` | Read-only codebase scout for `/research`. Knows the team's research methodology; structured domain-map output. |
| `dev-intake` | Clarification interviewer for `/intake` when delegated (multi-task or background contexts). |

### GitHub Actions templates (`templates/.github/workflows/`)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `claude-pr-review.yml` | `pull_request` (opened / synchronize / ready_for_review) | Fetches diff (capped at 200KB), reads the plan file from the diff, calls Claude (Sonnet by default; configurable via `CLAUDE_REVIEW_MODEL` secret) with a 9-dimension review prompt. Posts the review as a single PR comment (advisory — never blocks merge). |
| `jira-on-merge.yml` | `pull_request` `closed` with `merged: true` to `main`/`master` | Parses `Jira-Ticket: <KEY>` from PR body (regex anchored on line start). Idempotent — checks current Jira status before transitioning. Falls back to "any transition into `done` category" if no exact-name match. |

**Both workflows are PR-only** — direct pushes to `main` bypass them by design (no review opportunity, wrong cue for "Done"). Branch protection on `main` enforces the PR-based path.

### Methodology (`methodology/`)

Five protocol docs that explain the *why* behind each stage. Skills implement the protocols; the docs are the durable reference.

- `00-overview.md` — five-stage pre-work loop, soft-gate philosophy
- `01-intake-protocol.md` — slug rules, oversized-request detection, question priorities
- `02-research-protocol.md` — how to scout an unfamiliar repo, what to log, when to stop
- `03-planning-protocol.md` — canonical plan shape, estimation convention (1 SP = 1 dev-day)
- `04-alignment-protocol.md` — approval gate semantics, frozen-plan invariants

### Templates for target repos (`templates/`)

- `target-repo-CLAUDE.md` — drop into the target repo's root; references `~/sourceControl/claude-development-eco-system/methodology/` so protocols become canonical
- `docs/adr/template.md`, `docs/research/template.md`, `docs/plans/template.md` — the artifact shapes
- `docs/research/INDEX.md` — researcher's index of durable domain maps

### Settings & hooks (`settings/`, `hooks/`)

- `permissions.json` — pre-allowed safe Bash (read-only: ls, grep, git status/log/diff, rg, find) so research has zero permission prompts
- `hooks.json` — registrations for the three best-effort hooks
- `hooks/posttooluse-format-ts.sh` — runs prettier/eslint after Edit/Write on TS files
- `hooks/posttooluse-format-py.sh` — runs ruff/black after Edit/Write on Python files
- `hooks/userpromptsubmit-stage-banner.sh` — injects current plan path + stage into each turn (informational, non-blocking)

**No PreToolUse blocking hook** — by design. Soft gates: discipline lives in the skills, role prompts, and reviewers.

### Per-repo configuration

- `~/sourceControl/claude-development-eco-system/jira.json` — Jira Cloud credentials + config (canonical location; `~/.claude-development-eco-system/jira.json` is a symlink to it). Schema: `base_url`, `email`, `api_token`, `story_points_field` (e.g., `customfield_10016`), optional `repo_url_template`.
- `<target-repo>/CLAUDE.md` — references the eco-system methodology
- `<target-repo>/docs/{plans,plans/archive,research,adr,metrics}/` — artifact homes; ADRs and the calibration log live with the code

## Conventions enforced across the loop

- **No code before approved plan.** `/dev-roles` and downstream refuse `status: draft`.
- **No work on `main`.** `/start-dev` creates `plan/<slug>`; `/ready-for-review` refuses on trunk.
- **Advisor-only autonomy.** Humans approve every PR, every merge, every deploy. No autonomous merges, no force-pushes without `--force-with-lease` + explicit confirmation.
- **1 story point = 1 dev-day (8h)**, not Fibonacci complexity. `/plan`'s estimator computes `max(1, ceil(hours/8))`.
- **Curated Jira subset, not markdown dump.** `/jira-sync` renders ADF with proper headings, bullet lists, taskLists for `- [ ]`, inline links and code.
- **Replace, don't append, the Jira description.** Idempotency via replacement; audit trail via comments.
- **Calibration log is append-only.** Even retroactive corrections add new rows or notes — never delete.
- **PR-based merge cue.** Direct push to `main` bypasses both GHA workflows by design.
- **3-cycle rejection cap.** Architect/reviewer rejections cap at 3 cycles before surfacing to the user.

## Closing-the-loop guarantees

- Every approved plan that ships has: `started_at` (from `/start-dev`), `done_at` + `actual_hours` (from `/done`), and one row in `docs/metrics/calibration.tsv`.
- Every closed plan is archived to `docs/plans/archive/`, keeping the active folder small so `/intake` and `/research` aren't confused by stale matches.
- Every Jira ticket synced from a plan ends in Done iff the PR was merged — driven by the `Jira-Ticket: <KEY>` line in the PR body, parsed by `jira-on-merge.yml`.
- Every PR has both: a Claude AI review comment (from `claude-pr-review.yml`) and a `Jira-Ticket:` traceability line.

## Verified end-to-end

The full loop was exercised on `Maitre-ai` for the `improve-order-drawer-fast-path` plan (SCRUM-1):
- `/scope` → fast-path Brief + Domain Map in one round
- `/plan` → architect APPROVED on cycle 1, frozen, started_at stamped
- `/jira-sync SCRUM-1` → ADF description + In Progress transition + audit comment
- `/dev-roles full` → 4 cards + footer slot + dirty-aware nav modal + customer-filter banner; 19 tests added (Vitest + RTL + MSW v2)
- Manual git push of GHA templates committed (`c0a9e73`)
- `/done` → actual 1.45h vs estimate 24h, accuracy 0.060 (faster than estimate due to fast-path overlap)

The Maitre-ai repo is now at <https://github.com/Moyal17/Maitre.git>.

## Install / update / uninstall

```bash
# Install (idempotent)
git clone <repo-url> ~/sourceControl/claude-development-eco-system
cd ~/sourceControl/claude-development-eco-system
./install.sh

# Update
cd ~/sourceControl/claude-development-eco-system && git pull && ./install.sh

# Uninstall (removes only symlinks created by this script)
./install.sh --uninstall

# Per-repo opt-in
cp ~/sourceControl/claude-development-eco-system/templates/target-repo-CLAUDE.md <repo>/CLAUDE.md
mkdir -p <repo>/docs/{adr,research,plans,plans/archive,metrics}
cp ~/sourceControl/claude-development-eco-system/templates/.github/workflows/{claude-pr-review,jira-on-merge}.yml <repo>/.github/workflows/
```

GHA secrets to set on the target GitHub repo: `ANTHROPIC_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`. Optional: `CLAUDE_REVIEW_MODEL`, `CLAUDE_REVIEW_PROMPT`, `JIRA_DONE_TRANSITION_NAME`.

## Deferred to later passes

| Phase | Scope |
|-------|-------|
| B | Build methodology (M3) — implementor playbook depth, conventions per stack |
| C | Review methodology depth (M4) — per-language reviewer variants |
| D | Wiring methodology depth (M5) — TS + Python wiring trace specifics |
| E | CI/CD methodology (M7) — beyond the two PR workflows |
| F | Onboarding kit, observability, metrics surfacing, documentation lifecycle |

## Versioning

`VERSION` tracks the toolkit. Bump on user-visible change (skill/agent contract, install layout, methodology revision).

- **0.2.0** — `/start-dev`, `/address-review`, local-check gate in `/ready-for-review`, plan archival in `/done`
- **0.1.0** — initial pre-work loop + Jira sync + dev-roles bundle + GHA templates + `/done` calibration
