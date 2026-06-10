# Agent Team — Command Reference

## 0. Using the Team Inside Claude Code (Recommended Starting Point)

The simplest way to use the team is through Claude Code directly — no engine to run, no API key needed beyond your normal Claude Code session.

A single `CLAUDE.md` file at `~/sourceControl/CLAUDE.md` activates the full team workflow automatically for every project inside that folder.

### What was created
```
~/sourceControl/
└── CLAUDE.md          ← auto-loaded by Claude Code for every project here
    └── @imports all 5 role prompts from agent-team/prompts/
```

### How it works
1. Open Claude Code in any project under `~/sourceControl/`
2. The `CLAUDE.md` is loaded automatically — no setup needed per session
3. The first time `@imports` are encountered, Claude Code will ask you to approve them — click **Allow**
4. Just give Claude Code a task. It will follow the full team gate workflow automatically:
   - `[CTO]` decomposes your request
   - `[IMPLEMENTOR]` explores and plans
   - `[ARCHITECT]` approves or rejects the plan
   - `[IMPLEMENTOR]` builds only after approval
   - `[CODE REVIEWER]` and `[WIRING EXPERT]` review in parallel
   - Fix loops until both gates pass

### Example session
Open Claude Code in `~/sourceControl/my-app/` and just say:
```
Add a password reset flow
```
Claude Code will announce each role switch and follow all gates without you having to manage anything.

---

## 1. One-Time Setup

### Install dependencies
```bash
cd ~/sourceControl/claude-development-eco-system/teams/agent-team
npm install
```

### Set your API key (required every session, or add to ~/.zshrc)
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Add the shell alias to ~/.zshrc so you can type `team` instead of the full path
```bash
echo 'function team() { cd ~/sourceControl/claude-development-eco-system/teams/agent-team && npm start -- "$@"; }' >> ~/.zshrc
source ~/.zshrc
```

---

## 2. The `team request` Command — Give the Team Work to Do

This is the main command. The CTO decomposes your request into tasks and the full team executes them.

### Simplest form — run from inside your project folder
```bash
cd ~/work/my-app
team request "Add a password reset flow"
```

### Explicit project path — run from anywhere
```bash
team request "Add a password reset flow" --project ~/work/my-app
```

### Multiple words, longer descriptions
```bash
team request "Add rate limiting to all public API endpoints — max 100 req/min per IP" --project ~/work/my-app
```

### Be specific about what you want
```bash
team request "Add a POST /auth/reset-password endpoint that accepts email, generates a token, stores it in the DB, and sends a reset email via the existing email service" --project ~/work/my-app
```

### Specify a feature with constraints
```bash
team request "Add CSV export to the /reports page. Must work for datasets up to 100k rows. No new dependencies." --project ~/work/my-app
```

---

## 3. The `team status` Command — Check What the Team is Doing

### Status for the current project
```bash
cd ~/work/my-app
team status
```

### Status for a specific project
```bash
team status --project ~/work/my-app
team status --project ~/work/client-portal
```

---

## 4. The `team run` Command — Resume or Retry a Task

If a task was interrupted, failed, or you want to re-run it:

### Resume a task
```bash
cd ~/work/my-app
team run TASK-001
```

### Resume with explicit project path
```bash
team run TASK-001 --project ~/work/my-app
team run TASK-003 --project ~/work/client-portal
```

---

## 5. Working Across Multiple Projects

Each project keeps its own task history in `<project>/.agent-team/`. No collisions.

```bash
# Morning — work on the saas app
team request "Build the subscription billing page" --project ~/work/my-saas-app

# Afternoon — switch to the client portal
team request "Fix the broken search pagination" --project ~/work/client-portal

# Check status of each independently
team status --project ~/work/my-saas-app
team status --project ~/work/client-portal
```

---

## 6. State Directory Override (Advanced)

Only needed if you want to store task history somewhere other than inside the project folder.

```bash
# Store state in a custom location
team request "Add search" --project ~/work/my-app --state-dir ~/my-team-state/my-app

# Useful if the project folder is read-only or managed by a third party
team request "Fix bug" --project ~/work/vendor-code --state-dir ~/state/vendor-fix
```

---

## 7. Using Claude Code Instead of the Engine

When you want to have a conversation with Claude Code and have it follow the team workflow — without running the engine.

### Tell Claude Code to act as the full team
```
Follow the agent team workflow from ~/sourceControl/claude-development-eco-system/teams/agent-team.
Act as the CTO. The project is at ~/work/my-app.
I want to add OAuth login with Google.
```

### Tell Claude Code to act as a specific role only
```
Act as the Architect from ~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/architect.md
and review this implementation plan: [paste plan]
```

```
Act as the Wiring Expert from ~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/wiring_expert.md
and trace this feature end-to-end in the project at ~/work/my-app
```

```
Act as the Code Reviewer from ~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/code_reviewer.md
and review the diff I am about to paste.
```

### Tell Claude Code to review something it just wrote
```
Now switch to the Wiring Expert role and review what you just implemented.
Use the criteria from ~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/wiring_expert.md
```

---

## 8. Automatic Team Workflow via CLAUDE.md

Add a `CLAUDE.md` to any project root and Claude Code will follow the team workflow automatically — no need to say anything at the start of each session.

```bash
cat >> ~/work/my-app/CLAUDE.md << 'EOF'

## Agent Team Workflow
This project uses the agent team at ~/sourceControl/claude-development-eco-system/teams/agent-team.
When implementing any feature or fix:
- Read ~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/implementor.md and follow Phase 1-2 (explore, plan) before writing any code
- After planning, check it against ~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/architect.md criteria before proceeding
- After implementing, self-review using ~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/code_reviewer.md criteria
- After self-review, trace the feature using ~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/wiring_expert.md criteria
- Only declare done when all gate criteria pass
EOF
```

---

## 9. Quick Reference Table

| What you want to do | Command |
|---|---|
| Give the team a task | `team request "..." --project <path>` |
| Give the team a task (from inside the project) | `cd <project> && team request "..."` |
| Check what the team is doing | `team status --project <path>` |
| Resume an interrupted task | `team run TASK-001 --project <path>` |
| Use Claude Code as the full team | Tell it: *"Follow ~/sourceControl/claude-development-eco-system/teams/agent-team workflow"* |
| Use Claude Code as one specific role | Tell it: *"Act as the Architect from ~/sourceControl/claude-development-eco-system/teams/agent-team/prompts/architect.md"* |
| Make a project always use the team | Add `CLAUDE.md` with team instructions to project root |
| Separate state from project folder | Add `--state-dir <path>` to any command |

---

## 10. .gitignore Entry for Every Project

Add this to prevent task state from being committed:

```
# Agent team task state
.agent-team/
```
