# create-agent-team Skill

A Claude Code skill that designs and generates a complete agent team following the structure and quality of `~/sourceControl/claude-development-eco-system/teams/agent-team`. Use it to create structured AI teams for any domain — software development, design, QA, data science, security, content, research, or anything that benefits from roles with enforced quality gates.

---

## How to Invoke

Type the slash command in any Claude Code session:

```
/create-agent-team
```

With a hint to skip the first question:

```
/create-agent-team data science team
/create-agent-team security audit team
/create-agent-team UX and design team
/create-agent-team content review team
/create-agent-team QA and testing team
```

Claude Code auto-invokes this skill when you ask it to create an agent team in natural language — you do not have to type the slash command manually.

---

## What It Produces

Every generated team is a complete, production-ready folder containing:

```
<team-name>/
├── team.json                    # Master config — agents, workflow, gates, tool and schema paths
├── CLAUDE.md                    # Claude Code integration — @imports all role prompts + gate rules
├── USAGE.md                     # Two modes, per-project setup, state isolation guide
├── COMMANDS.md                  # Full CLI and Claude Code command reference
├── prompts/
│   └── <role>.md                # One system prompt per role
├── schemas/
│   └── <artifact>.schema.json   # JSON Schema for every artifact (plan, report, etc.)
├── tools/schemas/
│   └── <tool>.json              # Input/output schema for every inter-role tool call
├── tasks/
│   └── decomposition.md         # Orchestrator's process for breaking down user requests
└── src/                         # Optional — TypeScript autonomous engine
    ├── types.ts
    ├── state.ts
    ├── tools.ts
    ├── runner.ts
    ├── orchestrator.ts
    └── index.ts
```

Plus a `CLAUDE.md` in the parent directory so the team activates automatically for all projects in that folder.

---

## The 5 Phases

The skill runs through five phases in order. It will not generate any files before you confirm the design in Phase 3.

---

### Phase 1 — Read the Reference Team

Before asking you anything, the skill reads the reference team at `~/sourceControl/claude-development-eco-system/teams/agent-team` to internalize the quality bar:

- `team.json` — config structure and workflow state machine
- All role prompts — tone, format, depth of instructions
- `tasks/decomposition.md` — orchestrator pattern
- `CLAUDE.md` — integration pattern

Everything generated will match or exceed this quality.

---

### Phase 2 — Interview

The skill asks you 7 questions in a single message. Answer all of them before it moves on.

| # | Question | Purpose |
|---|---|---|
| 1 | What is this team's domain and purpose? | Defines the problem the team solves |
| 2 | What is the team's name? | Used for folder name and config identifiers |
| 3 | Where should the team be created? | Full directory path |
| 4 | Who are the roles? (3–7) | Maps to prompts, tool schemas, and workflow stages |
| 5 | What are the gates? | Defines what must be approved before each handoff |
| 6 | What does each role produce? | Defines artifact schemas |
| 7 | Engine or Claude Code only? | Determines whether `src/` is generated |

**On roles:** every team needs at minimum:

- An **orchestrator** — decomposes work, assigns tasks, monitors progress
- A **quality authority** — approves plans before work begins, answers consultations
- One or more **workers** — do the primary domain work
- One or more **reviewers** — validate output from independent angles (run in parallel)

**On the engine choice:**

| Engine | Claude Code only |
|---|---|
| Generates `src/`, `package.json`, `tsconfig.json` | No source files generated |
| Team runs autonomously via `npm start` | Team runs entirely inside Claude Code |
| Requires `ANTHROPIC_API_KEY` | Uses your active Claude Code session |
| Best for long-running or unattended work | Best for interactive, conversational work |

---

### Phase 3 — Design Document

Before generating any files, the skill produces a **Team Design Document** for your review:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEAM DESIGN: <Team Name>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE        — what the team does and why
LOCATION       — where the folder will be created
ROLES          — each role: title, model, gate authority, artifacts
WORKFLOW       — every stage with owners, gates, and transitions
GATES          — each gate: authority, approve/reject tools, rejection destination
FILES          — complete list of every file to be generated
```

You will be asked: **"Does this look right? Any roles, gates, or workflow steps to adjust?"**

The skill waits for your confirmation. Respond with approval or corrections. It will revise and re-present until you are satisfied.

---

### Phase 4 — File Generation

Once you confirm, the skill generates every file. Quality standards per file type:

**Role prompts (`prompts/<role>.md`)**
- `## Identity` — who this agent is and what their approval means
- `## Core Responsibilities` — numbered list
- Domain-specific criteria sections (review dimensions, execution standards, etc.)
- `## Output Format` — exact JSON structure with all fields defined
- `## What You Must Never Do` — firm prohibitions

**Tool schemas (`tools/schemas/<tool>.json`)**
- `name`, `description`, `input_schema`, `output_schema`
- Description explains who calls the tool and what it triggers
- All required fields marked in `input_schema`

**Data schemas (`schemas/<artifact>.schema.json`)**
- JSON Schema draft-07
- Every field has a `description`
- Enums used for all fixed-value fields (status, decision, severity)
- `$defs` for reusable sub-schemas

**`team.json`**
- Full agent list with model, prompt path, tools, gate authority
- Complete workflow state machine with stage transitions
- Gate definitions with approve/reject tools
- Audit block with logging and escalation settings

**`CLAUDE.md` (inside team folder)**
- `@imports` all role prompts
- Step-by-step workflow with role announcements
- Gate rules as non-negotiable bullets

**`CLAUDE.md` (parent directory)**
- Same pattern — activates the team for all projects in the parent folder
- Created or appended to if one already exists

---

### Phase 5 — Confirmation and Close

After all files are generated, the skill:

1. Prints the complete file tree of everything created
2. Prints the exact first command to start using the team
3. Lists any parent `CLAUDE.md` files created or updated
4. Prints the `.gitignore` entry to add to your projects
5. Asks if you want to adjust any role prompt or workflow rule

---

## The Universal Gate Pattern

Every team the skill creates follows this gate structure, regardless of domain:

```
REQUEST
  │
  ▼
[ORCHESTRATOR] Decomposes into tasks
  │
  ▼
[WORKER] Explores context, produces a PLAN
  │
  ▼
[GATE 1: AUTHORITY] Reviews plan          ← BLOCKING
  │ APPROVED             │
  │               REJECTED → Worker revises → resubmit
  ▼
[WORKER] Executes the approved plan, produces OUTPUT
  │
  ▼
[GATE 2: REVIEWER-A] Reviews output      ← BLOCKING ┐
[GATE 2: REVIEWER-B] Reviews output      ← BLOCKING ┘ parallel
  │ BOTH APPROVED        │
  │      ANY REJECTED → Worker fixes → only rejecting reviewer re-reviews
  ▼
TASK DONE
```

Rules that never change across any team:

- No execution before plan approval
- Both output gates must pass in the same round
- On re-review, only the reviewer who rejected re-reviews
- Cross-consultation (worker asks authority mid-task) is always available
- Escalate to the user after 3 rejection cycles

---

## Domain Examples

| Domain | Orchestrator | Authority | Workers | Reviewers |
|---|---|---|---|---|
| Software dev | CTO | Architect | Implementor | Code Reviewer, Wiring Expert |
| Data science | Project Lead | Data Architect | Data Scientist | Statistical Reviewer, Pipeline Validator |
| UX / Design | Design Lead | Design Critic | UX Designer | Usability Reviewer, Accessibility Reviewer |
| Security audit | Security Lead | Threat Modeler | Security Analyst | Code Auditor, Infrastructure Auditor |
| Content | Editorial Lead | Fact Checker | Writer | Copy Editor, SEO Reviewer |
| QA / Testing | QA Lead | Test Architect | Test Engineer | Coverage Reviewer, Regression Validator |

---

## Skill File Structure

```
~/.claude/skills/create-agent-team/
├── SKILL.md              # Main instructions (the 5 phases)
├── HOW-TO-USE.md         # This file
├── reference.md          # Structural patterns and quality bar
└── templates/
    ├── role-prompt.md    # Template for every role prompt
    └── team-json.md      # Template for team.json
```
