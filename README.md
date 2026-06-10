# claude-development-eco-system

A self-contained, opinionated Claude Code toolkit for dev teams joining an existing repo.

**Current version: 0.3.0** — restructured into 3 layers (knowledge skills auto-activate, 6 explicit commands, dev team roles unchanged).

It ships:

- **Layer 1 — Knowledge skills (auto-activate, no slash command)** — `context-engineering`, `incremental-implementation`, `debugging-and-error-recovery`, `source-driven-development`. These fire on activity and bring deep engineering wisdom to every other skill.
- **Layer 2 — Explicit commands** — 6 commands: `/learn` (onboarding), `/feature` (end-to-end feature loop), `/quick-fix` (hotfixes), `/dev-roles` (manual role-switching workflow with mode flags), `/code-review` (9-dim diff review), `/done` (close-out + calibration).
- **Layer 3 — Dev team roles (unchanged)** — the 5 role prompts at `~/sourceControl/claude-teams/agent-team/prompts/{cto,architect,implementor,code_reviewer,wiring_expert}.md` are the binding contract for all gate work.

Plus methodology, templates, GHA workflows, settings, hooks, and an optional personal `~/.claude/CLAUDE.md` overlay.

**Operating principles:**
- A new dev can land in an unfamiliar repo and run `/learn` to map it, draft a CLAUDE.md, and identify hot-spots before writing any code.
- Every non-trivial change has a written brief, a real domain map, an approved plan, an architect-reviewed implementation, an AI-reviewed PR, and a documented audit trail.
- The system is **advisor-only**: Claude proposes, humans approve every PR, merge, and deploy.

See [`VERSION`](VERSION) and [`BUILD-SUMMARY.md`](BUILD-SUMMARY.md) for the changelog.

## The 3 layers (v0.3.0)

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1 — Knowledge skills (auto-activate, no slash command)    │
│   context-engineering         — what to load, when, trust levels │
│   incremental-implementation  — vertical slices, ~100 lines max  │
│   debugging-and-error-recovery — Reproduce→Localize→Reduce→Fix   │
│   source-driven-development   — cite official docs, no hallucinate│
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2 — Explicit commands (6 total)                           │
│   /learn       — onboard to a new repo (multi-session, resumable)│
│   /feature     — end-to-end feature loop (phases A–G internal)   │
│   /quick-fix   — hotfix path, < 30 lines, < 3 files              │
│   /dev-roles   — manual 5-role workflow (modes: full / plan-only │
│                  / review-only / architect-consult / custom)     │
│   /code-review — standalone 9-dim diff review                    │
│   /done        — close-out: actuals + calibration + archive      │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3 — Dev team roles (UNCHANGED)                            │
│   ~/sourceControl/claude-teams/agent-team/prompts/               │
│     cto.md / architect.md / implementor.md /                     │
│     code_reviewer.md / wiring_expert.md                          │
│   /feature Phase E plays each role; gates remain non-negotiable  │
└─────────────────────────────────────────────────────────────────┘
```

## Skills catalog

### Knowledge skills (auto-activate)

| Skill | Auto-fires on | What it does |
|-------|---------------|--------------|
| `context-engineering` | New session, output drift, switching tasks | 5-level context hierarchy, trust levels, anti-pollution |
| `incremental-implementation` | Multi-file change, > 100 lines about to be written | Vertical slices, test-after-each, scope discipline |
| `debugging-and-error-recovery` | Failing test, broken build, unexpected behavior | 6-step triage: Reproduce → Localize → Reduce → Fix → Guard → Verify |
| `source-driven-development` | Framework-specific code, library API question | Cite official docs, flag unverified, no hallucinated APIs |

### Commands

| Command | Purpose |
|---------|---------|
| `/learn` | Multi-session onboarding to an unfamiliar repo. Builds architecture map (via `dev-explorer`), extracts real conventions from recent merged PRs, identifies hot-spot files by churn, drafts a project CLAUDE.md candidate, runs a trust audit. Read-only; writes only to `docs/onboarding/`. |
| `/feature <description>` | End-to-end feature loop in one command. Internal phases: A (Frame/Brief), B (Map/Research), C (Plan + Architect gate), D (Branch + optional Jira sync), E (5-role build gate), F (Ship/PR), G (Address review). Resume via `--resume <slug>`. Flags: `--jira KEY`, `--no-pr`, `--mode=fast`. |
| `/quick-fix <bug>` | Hotfix path. CTO → joint Architect+Wiring scan → Implementor → Code Reviewer → Wiring re-trace. Single-round gates, no Jira, no PR auto-open. Bails to `/feature` when scan reveals the work is bigger than expected. |
| `/dev-roles [mode] <task>` | Manual 5-role workflow in one context. Modes: `full` (CTO → Architect → Implementor → Code Reviewer → Wiring), `plan-only`, `review-only`, `architect-consult`, or comma-separated subset. The flexible escape hatch when `/feature` is too heavy and `/quick-fix` is too light. |
| `/code-review` | Standalone 9-dim review on any diff (auth/authz, injection, concurrency, data integrity, error handling, API design, crypto, types, testing). |
| `/done <slug>` | After PR merge: stamp `done_at` + `actual_hours`, compute `accuracy_ratio`, append calibration row to `docs/metrics/calibration.tsv`, archive plan to `docs/plans/archive/`. |

## Agents catalog

Seven subagents under `agents/`:

| Agent | Role |
|-------|------|
| `dev-cto` | Decomposes user requests into tasks with acceptance criteria. Closes tasks only after full gate audit trail. |
| `dev-architect` | **Plan-approval gate authority.** Severity-tagged verdicts (BLOCKER/WARNING/SUGGESTION). Available for cross-consultation mid-task. |
| `dev-implementor` | Writes plans for architect approval, then implements exactly what was approved. Phase 5b: must resolve all warnings before TASK_DONE. |
| `dev-code-reviewer` | **Code-review-approval gate.** Reviews against the 9-dimension checklist. |
| `dev-wiring-expert` | **Wiring-approval gate.** Traces every feature entrypoint → terminal effect. Catches dead code, missing imports, missing registrations. |
| `dev-explorer` | Read-only codebase scout for `/research`. Structured domain-map output. |
| `dev-intake` | Clarification interviewer for `/intake` when delegated. |

## CI/CD: GitHub Actions templates

Two workflows ship in `templates/.github/workflows/`. Copy into your target repo's `.github/workflows/` and set the secrets.

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `claude-pr-review.yml` | `pull_request` (opened / synchronize / ready_for_review) | Calls Claude on the diff (capped at 200KB) with a 9-dimension review prompt. Reads the plan file from the diff for context. Posts findings as a single PR comment (advisory — never blocks merge). |
| `jira-on-merge.yml` | `pull_request` `closed` with `merged: true` to `main`/`master` | Parses `Jira-Ticket: <KEY>` from PR body. Idempotent — checks current Jira status before transitioning. |

**Both are PR-only by design.** Direct pushes to `main` bypass them. Configure branch protection on `main` to require PRs.

### Required GitHub Actions secrets

| Secret | Used by | What it is |
|--------|---------|------------|
| `ANTHROPIC_API_KEY` | `claude-pr-review.yml` | <https://console.anthropic.com/settings/keys> |
| `JIRA_BASE_URL` | `jira-on-merge.yml` | e.g., `https://yourorg.atlassian.net` |
| `JIRA_EMAIL` | `jira-on-merge.yml` | Atlassian account email |
| `JIRA_API_TOKEN` | `jira-on-merge.yml` | <https://id.atlassian.com/manage-profile/security/api-tokens> |
| `CLAUDE_REVIEW_MODEL` | `claude-pr-review.yml` (optional) | Default `claude-sonnet-4-6` |
| `CLAUDE_REVIEW_PROMPT` | `claude-pr-review.yml` (optional) | Override the default 9-dimension prompt |
| `JIRA_DONE_TRANSITION_NAME` | `jira-on-merge.yml` (optional) | Default `Done`; override for `Resolved` etc. |

## Operating principles

1. **No code before approved plan.** `/feature` Phase E (build) refuses to run without `status: planned`/architect APPROVED.
2. **No work on `main`.** `/feature` Phase D creates `plan/<slug>`; Phase F refuses on trunk.
3. **Advisor-only autonomy.** Humans approve every PR, merge, deploy.
4. **Soft gates by convention.** No PreToolUse blocking hook. Discipline lives in skills, role prompts, reviewers — not in tool-level enforcement.
5. **Reuse before invent.** `/feature` Phase B (Map) makes this systematic — every plan grounds in existing utilities.
6. **1 SP = 1 dev-day (8h)**, not Fibonacci complexity. `/feature` Phase C computes `max(1, ceil(hours/8))`.
7. **Curated Jira, not markdown dump.** `/feature --jira KEY` renders real ADF.
8. **Replace, don't append.** Jira description is overwritten; audit trail via comments. Calibration log is append-only.
9. **3-cycle rejection cap.** Surface to user before grinding further.
10. **Living documents.** CLAUDE.md, ADRs, research maps, plans evolve. Archive when done.
11. **Dev team roles are unchanged.** The 5 role prompts at `~/sourceControl/claude-teams/agent-team/prompts/` are read verbatim by `/feature` Phase E and `/quick-fix` — never edited by any skill.

## Layout

```
claude-development-eco-system/
├── README.md                       # this file
├── BUILD-SUMMARY.md                # versioned changelog + comprehensive ecosystem map
├── CLAUDE.md                       # how Claude operates inside the eco-system
├── INSTALL.md                      # install + per-repo opt-in instructions
├── VERSION                         # semver
├── install.sh                      # idempotent symlink installer (--dry-run, --uninstall)
├── jira.json                       # Jira Cloud config (canonical location; gitignored)
│
├── skills/                         # 6 explicit commands + knowledge namespace
│   ├── learn/                      # onboarding (multi-session, resumable)
│   ├── feature/                    # end-to-end loop (phases A–G internal)
│   ├── quick-fix/                  # hotfix path
│   ├── dev-roles/                  # manual role-switching workflow with mode flags
│   ├── code-review/                # standalone 9-dim review
│   ├── done/                       # actuals + calibration + archive
│   └── knowledge/                  # auto-activating, no slash command
│       ├── context-engineering/
│       ├── incremental-implementation/
│       ├── debugging-and-error-recovery/
│       └── source-driven-development/
│
├── agents/                         # 7 subagent definitions
│   ├── dev-cto.md
│   ├── dev-architect.md
│   ├── dev-implementor.md
│   ├── dev-code-reviewer.md
│   ├── dev-wiring-expert.md
│   ├── dev-explorer.md
│   └── dev-intake.md
│
├── methodology/                    # the WHY behind each stage
│   ├── 00-overview.md
│   ├── 01-intake-protocol.md
│   ├── 02-research-protocol.md
│   ├── 03-planning-protocol.md
│   └── 04-alignment-protocol.md
│
├── templates/                      # what ships into target repos
│   ├── target-repo-CLAUDE.md
│   ├── docs/{adr,research,plans}/template.md
│   ├── docs/research/INDEX.md
│   └── .github/workflows/
│       ├── claude-pr-review.yml    # AI review on every PR
│       └── jira-on-merge.yml       # ticket → Done on PR merge
│
├── settings/                       # ready-to-merge fragments
│   ├── permissions.json            # pre-allowed safe Bash (read-only)
│   └── hooks.json                  # PostToolUse formatters + UserPromptSubmit banner
│
├── hooks/                          # the actual hook scripts
│   ├── posttooluse-format-ts.sh
│   ├── posttooluse-format-py.sh
│   └── userpromptsubmit-stage-banner.sh
│
└── examples/
    └── 01-add-idempotency/         # walkthrough of the full pre-work loop
```

## Quickstart

### 1. Install the toolkit

```bash
git clone <this-repo> ~/sourceControl/claude-development-eco-system
cd ~/sourceControl/claude-development-eco-system
./install.sh
```

`install.sh` symlinks every folder under `skills/` into `~/.claude/skills/` and every file under `agents/` into `~/.claude/agents/`. It prints settings fragments for you to merge by hand into `~/.claude/settings.json` (it never overwrites your settings).

### 2. Set up Jira credentials (once per machine)

Create `~/sourceControl/claude-development-eco-system/jira.json`:

```json
{
  "base_url": "https://YOUR_SITE.atlassian.net",
  "email": "you@your-org.com",
  "api_token": "PASTE_REAL_TOKEN",
  "story_points_field": "customfield_10016"
}
```

Then symlink so `/jira-sync` finds it:

```bash
mkdir -p ~/.claude-development-eco-system && chmod 700 ~/.claude-development-eco-system
ln -s ~/sourceControl/claude-development-eco-system/jira.json ~/.claude-development-eco-system/jira.json
chmod 600 ~/sourceControl/claude-development-eco-system/jira.json
```

Generate an API token at <https://id.atlassian.com/manage-profile/security/api-tokens>.

### 3. Opt a target repo into the ecosystem

```bash
cd <your-target-repo>
cp ~/sourceControl/claude-development-eco-system/templates/target-repo-CLAUDE.md CLAUDE.md
mkdir -p docs/{adr,research,plans,plans/archive,metrics}
cp ~/sourceControl/claude-development-eco-system/templates/docs/research/INDEX.md docs/research/INDEX.md

# Optional but recommended: install the GHA workflows
mkdir -p .github/workflows
cp ~/sourceControl/claude-development-eco-system/templates/.github/workflows/{claude-pr-review,jira-on-merge}.yml .github/workflows/

# Set the GitHub repo secrets via the UI or:
gh secret set ANTHROPIC_API_KEY
gh secret set JIRA_BASE_URL --body "https://yourorg.atlassian.net"
gh secret set JIRA_EMAIL --body "you@yourorg.com"
gh secret set JIRA_API_TOKEN

git add CLAUDE.md docs/ .github/workflows/
git commit -m "chore: opt into claude-development-eco-system"
```

### 4. Configure branch protection on `main`

Via the GitHub UI: **Settings → Branches → Add rule** for `main`:
- Require a pull request before merging
- Require status checks (optionally make `Claude PR review` required, though it's advisory by default)
- Block direct pushes

Without this, our PR-based loop is opt-in by convention only.

## Walking through a real task (v0.3.0)

```bash
# Joining a new repo (first 1–2 weeks, multi-session)
/learn                                   # writes docs/onboarding/, multi-session resumable

# Normal feature (one command, internal phases A–G)
/feature improve order drawer dialog --jira SCRUM-42
# → A Frame, B Map, C Plan + architect approve, D Branch + Jira → In Progress,
#   E 5-role gate (CTO/Arch/Impl/Reviewer/Wiring), F Ship/PR + Jira → In Review,
#   G Address PR review findings (interactive)

# After human merges the PR (jira-on-merge.yml transitions ticket → Done):
/done improve-order-drawer-dialog        # actuals + calibration row + archive

# Hotfix path (skip the loop entirely)
/quick-fix CHIRP3_LOCATION undefined in TransVibeStartGcpTranscription.mjs:316

# Standalone diff review
/code-review                             # 9-dim review on the current diff
```

Knowledge skills (`context-engineering`, `incremental-implementation`, `debugging-and-error-recovery`, `source-driven-development`) auto-activate inside every command — no need to invoke them.

## Updating

```bash
cd ~/sourceControl/claude-development-eco-system && git pull && ./install.sh
```

Re-running `install.sh` is safe; it skips already-correct symlinks.

## Uninstalling

```bash
./install.sh --uninstall
```

Removes only the symlinks created by this script. `~/.claude/settings.json` and per-repo `CLAUDE.md` files are left alone.

## Versioning

Tracked in [`VERSION`](VERSION). Breaking changes to skill/agent contracts bump the minor; breaking changes to install layout bump the major.

- **0.3.0** — Restructured into 3 layers. Collapsed 8 legacy commands (`/intake`, `/scope`, `/research`, `/plan`, `/jira-sync`, `/start-dev`, `/ready-for-review`, `/address-review`) into one `/feature` command with internal phases A–G — and **deleted them entirely**, no archive. Kept `/dev-roles` and `/code-review` as standalone commands. Added `/learn` for new-project onboarding. Ported 4 auto-activating knowledge skills (`context-engineering`, `incremental-implementation`, `debugging-and-error-recovery`, `source-driven-development`) under `skills/knowledge/`. Added personal `~/.claude/CLAUDE.md` overlay template. Dev team role prompts UNCHANGED.
- **0.2.0** — `/start-dev`, `/address-review`, local-check gate in `/ready-for-review`, plan archival in `/done`
- **0.1.0** — initial pre-work loop + Jira sync + dev-roles bundle + GHA templates + `/done` calibration

## Deferred to later passes

| Phase | Scope |
|-------|-------|
| B | Build methodology depth (M3) |
| C | Per-language reviewer variants (M4) |
| D | TS + Python wiring trace specifics (M5) |
| E | CI/CD methodology beyond the two PR workflows (M7) |
| F | Onboarding kit, observability, metrics dashboards |

## License

Internal toolkit. License TBD before public release.
