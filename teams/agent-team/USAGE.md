# How to Use the Agent Team

## The Two Modes

### Mode 1 — Autonomous Engine (the `npm start` way)
The engine makes its own Claude API calls. You run it, walk away, and the team executes the work. You are not in the loop.

```bash
cd ~/sourceControl/claude-teams/agent-team
export ANTHROPIC_API_KEY=sk-ant-...

npm start -- request "Add a password reset flow" --project /Users/user/my-app
```

What happens next — automatically, no input from you:
1. CTO reads your request and creates tasks
2. Implementor explores your project files and writes a plan
3. Architect reviews the plan — approves or sends it back
4. Implementor writes the code in your actual project files
5. Code Reviewer and Wiring Expert review in parallel
6. Fix loop runs if either reviewer rejects
7. Done — code is sitting in your project

To use it on a different project, just change `--project`:
```bash
npm start -- request "Add rate limiting to the API" --project /Users/user/another-app
npm start -- request "Build a CSV export feature" --project /Users/user/work/client-portal
```

---

### Mode 2 — Using Claude Code with the Team Workflow
You talk to Claude Code directly, and ask it to follow the team's roles and gates. No autonomous engine runs — but you get the team's discipline and quality gates inside your conversation.

At the start of a Claude Code session, say:

> "Follow the agent team workflow from `~/sourceControl/claude-teams/agent-team`. Act as the CTO. I want to add X to my project at `/path/to/project`."

Claude Code will then:
- Read `team.json` and the prompts
- Play the CTO — decompose into tasks and write them out
- Play the Implementor — write a plan and submit it for architect review
- Play the Architect — review the plan and approve or reject it
- Implement only after the plan passes
- Play the Code Reviewer and Wiring Expert — review the work against those criteria
- Not declare done until all gates pass

The tradeoff: it is one model playing all roles, so there is less genuine independent perspective than the autonomous engine gives you. But it provides the structure and the paper trail inside a single conversation.

---

## For Different Projects — The Recommended Setup

The engine is project-agnostic. The team lives in one place. Your projects do not need to know about the team config.

```
~/sourceControl/
└── agent-team/          ← the team lives here, shared across all projects
    ├── team.json
    ├── prompts/
    ├── src/
    └── state/
        └── tasks/       ← all task state goes here, for any project

~/work/
├── my-saas-app/         ← your projects, untouched by the team config
├── client-portal/
└── internal-tool/
```

---

## Per-Project Setup

There are two things worth adding to each project.

### 1. A `CLAUDE.md` in each project root

This tells Claude Code to follow the team workflow automatically whenever you open that project:

```markdown
# CLAUDE.md

## Agent Team Workflow
This project uses the agent team at ~/sourceControl/claude-teams/agent-team.
When implementing features, follow the team workflow:
- Plan before coding (architect must approve the plan)
- Submit to code reviewer and wiring expert gates before declaring done
- Reference prompts at ~/sourceControl/claude-teams/agent-team/prompts/
- Reference the workflow at ~/sourceControl/claude-teams/agent-team/team.json
```

### 2. A shell alias so you don't type the full path every time

Add this to your `~/.zshrc`:

```bash
function team() {
  cd ~/sourceControl/claude-teams/agent-team && npm start -- "$@"
}
```

Then from anywhere:

```bash
team request "Add OAuth login" --project ~/work/my-saas-app
team status
team run TASK-003 --project ~/work/my-saas-app
```

---

## State Isolation Between Projects

Each project automatically gets its own task history at `<project>/.agent-team/`. The team engine stays shared and central. Projects never share or collide on task state.

```
~/work/my-saas-app/
└── .agent-team/
    ├── tasks/
    │   ├── TASK-001.json
    │   └── TASK-002.json
    └── consultations/

~/work/client-portal/
└── .agent-team/
    ├── tasks/
    │   └── TASK-001.json       ← separate, no collision
    └── consultations/
```

No extra flags needed — this is the default. Just point `--project` at the right directory:

```bash
team request "Add search" --project ~/work/my-saas-app
team request "Fix billing" --project ~/work/client-portal
team status --project ~/work/my-saas-app
```

To override the state location (e.g. keep state outside the project), pass `--state-dir` explicitly:

```bash
team request "Add search" --project ~/work/my-saas-app --state-dir ~/teams-state/my-saas-app
```

Add `.agent-team/` to each project's `.gitignore` so task state is not committed to version control:

```
# .gitignore
.agent-team/
```

---

## CLI Reference

```bash
# Submit a new request — CTO decomposes and team executes it
npm start -- request "<description>" --project <path>

# Resume or re-run a specific task by ID
npm start -- run TASK-001 --project <path>

# Check status of all tasks for a project
npm start -- status --project <path>

# Override the state directory (optional, rarely needed)
npm start -- request "<description>" --project <path> --state-dir <custom-state-path>
```

---

## Which Mode to Use When

| Situation | Use |
|---|---|
| You want the team to write code autonomously | `npm start` engine |
| You want the team's discipline inside a Claude Code session | Tell Claude Code to follow the workflow |
| Switching between projects | Change the `--project` flag |
| Opening Claude Code in a project | Add a `CLAUDE.md` referencing the team |
| Multiple projects with separate task histories | Add the `--state-dir` flag |

---

## Gate Workflow Reference

```
User Request
    │
    ▼
[CTO] Decomposes into tasks
    │
    ▼
[Implementor] Writes implementation plan
    │
    ▼
[GATE: Architect] Approves or rejects plan        ← BLOCKING
    │ APPROVED                       │
    │                         REJECTED → Implementor revises → resubmits
    ▼
[Implementor] Writes code
    │
    ▼
[GATE: Code Reviewer] Reviews quality/security    ┐ BLOCKING
[GATE: Wiring Expert] Traces feature e2e          ┘ PARALLEL
    │ BOTH APPROVED                  │
    │              ANY REJECTED → Implementor fixes → only rejecting reviewer re-reviews
    ▼
TASK DONE
```

No task is closed until all three gates have passed in the same review round.
