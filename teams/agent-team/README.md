# Agent Team

Multi-agent engineering team with enforced architectural oversight and dual-review quality gates.

## Structure

```
agent-team/
├── team.json                          # Master team configuration
├── prompts/
│   ├── cto.md                         # CTO orchestrator system prompt
│   ├── architect.md                   # Architect reviewer system prompt
│   ├── code_reviewer.md               # Code reviewer system prompt
│   ├── wiring_expert.md               # E2E wiring expert system prompt
│   └── implementor.md                 # Implementor system prompt (shared)
├── schemas/
│   ├── task.schema.json               # Task data structure
│   ├── plan.schema.json               # Implementation plan data structure
│   ├── review_report.schema.json      # Code review report data structure
│   └── wiring_report.schema.json      # Wiring review report data structure
├── tools/schemas/
│   ├── plan_submit.json               # Implementor submits plan to architect
│   ├── plan_approve.json              # Architect approves plan
│   ├── plan_reject.json               # Architect rejects plan
│   ├── implementation_submit.json     # Implementor submits code for review
│   ├── review_approve.json            # Code reviewer approves
│   ├── review_reject.json             # Code reviewer rejects
│   ├── wiring_approve.json            # Wiring expert approves
│   ├── wiring_reject.json             # Wiring expert rejects
│   ├── cross_consult_request.json     # Any agent requests architect opinion
│   └── cross_consult_respond.json     # Architect delivers opinion
└── tasks/
    └── decomposition.md               # CTO prompt for breaking down user requests
```

## Workflow

```
User Request
    │
    ▼
[CTO] Decomposes into tasks (tasks/decomposition.md)
    │
    ▼
[Implementor] Writes implementation plan
    │
    ▼
[GATE: Architect] plan_approval ◄─── BLOCKING
    │ APPROVED                 │
    │                   REJECTED → Implementor revises plan
    ▼
[Implementor] Implements code
    │
    ▼
[GATE: Code Reviewer] code_review_approval  ┐ BLOCKING
[GATE: Wiring Expert] wiring_approval       ┘ PARALLEL
    │ BOTH APPROVED            │
    │              ANY REJECTED → Implementor fixes → Re-review loop
    ▼
[CTO] Verifies audit trail → TASK_DONE
```

## Orchestration Engine

The engine is a TypeScript application that reads `team.json`, drives Claude API calls per agent, and enforces the gate workflow.

### Setup

```bash
cd ~/sourceControl/claude-development-eco-system/teams/agent-team
npm install
export ANTHROPIC_API_KEY=sk-ant-...
```

### Usage

```bash
# Submit a request — CTO decomposes and team executes it
npm start -- request "Add a user authentication endpoint" --project /path/to/your/project

# Resume or re-run a specific task
npm start -- run TASK-001 --project /path/to/your/project

# Check status of all tasks
npm start -- status
```

Task state is persisted in `state/tasks/TASK-NNN.json` — survives restarts.

---

## Agents

| Agent | Model | Gate Authority |
|---|---|---|
| CTO | claude-opus-4-6 | Task creation and closure |
| Architect | claude-opus-4-6 | plan_approval |
| Code Reviewer | claude-sonnet-4-6 | code_review_approval |
| Wiring Expert | claude-sonnet-4-6 | wiring_approval |
| Implementor 1 | claude-sonnet-4-6 | — |
| Implementor 2 | claude-sonnet-4-6 | — |

## Gate Rules

- **No code before plan approval** — architect gate is hard-blocking
- **Both review gates must pass** — code_review AND wiring run in parallel; both must approve
- **Rejection loops until clean** — fix cycles repeat until all gates approve in the same round
- **Re-review is scoped** — only reviewers who previously rejected re-review after a fix
- **Cross-consultation is always available** — any agent can ask the architect a question mid-task



## Here's how to operate it from this Claude session. You have two modes:

  ---
  Mode 1: Autonomous Engine (npm start)

  The team runs itself via the Anthropic API — no Claude Code involvement after
  launch.
```bash
cd ~/sourceControl/claude-development-eco-system/teams/agent-team
export ANTHROPIC_API_KEY=sk-ant-...
npm install  # first time only

  # Submit a feature request
npm start -- request "Add password reset flow" --project /path/to/your/project

  # Check status
npm start -- status --project /path/to/your/project

  # Resume a stalled task
npm start -- run TASK-001 --project /path/to/your/project
  ```

  ---
## Mode 2: Claude Code as the Team (Recommended for this session)

  Claude Code (this session) is the team — acting as each agent in sequence.
  This works automatically when you open Claude in a project that lives under
  ~/sourceControl/, because ~/sourceControl/CLAUDE.md auto-loads the team
  workflow.

  To use it right now:

  1. Open Claude Code inside a project under ~/sourceControl/:
  claude /path/to/~/sourceControl/my-project
  2. Then just tell Claude what you want built — it will follow the gate
  workflow:
    - CTO breaks it into tasks
    - Implementor writes a plan
    - Architect approves/rejects the plan
    - Implementor codes
    - Code Reviewer + Wiring Expert review in parallel
    - CTO closes when all gates pass

  Or tell me directly right now — if you point me at a project and describe a
  feature, I can run through the full gate workflow in this session by reading
  in the team prompts manually.

  ---
  Which do you want to do?

  - "Run the engine" → you need ANTHROPIC_API_KEY set and npm install done —
  want me to check/set that up?
  - "Use this Claude as the team" → tell me the project path and what you want
  to build
