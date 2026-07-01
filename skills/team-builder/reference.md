# Reference: Agent Team Structure and Patterns

This file is loaded by the team-builder skill as architectural reference.
It describes the patterns, conventions, and quality bar to follow when generating a new team.

---

## Directory Structure (Required)

```
<team-name>/
├── team.json                        # Master config — agents, workflow, gates, schemas
├── CLAUDE.md                        # Claude Code integration — @imports all role prompts
├── USAGE.md                         # Two modes, per-project setup, state isolation
├── COMMANDS.md                      # Full CLI and Claude Code command reference
├── prompts/
│   ├── <orchestrator>.md            # CTO equivalent — decomposes, assigns, monitors
│   ├── <authority>.md               # Architect equivalent — approves plans, consults
│   ├── <worker>.md                  # Implementor equivalent — does the primary work
│   ├── <reviewer-1>.md              # First output reviewer
│   └── <reviewer-2>.md              # Second output reviewer (different angle)
├── schemas/
│   ├── task.schema.json             # The unit of work
│   ├── plan.schema.json             # The worker's submitted plan
│   ├── <reviewer-1>_report.schema.json
│   └── <reviewer-2>_report.schema.json
├── tools/schemas/
│   ├── plan_submit.json
│   ├── plan_approve.json
│   ├── plan_reject.json
│   ├── output_submit.json
│   ├── <gate-1>_approve.json
│   ├── <gate-1>_reject.json
│   ├── <gate-2>_approve.json
│   ├── <gate-2>_reject.json
│   ├── cross_consult_request.json
│   └── cross_consult_respond.json
├── tasks/
│   └── decomposition.md
└── src/                             # Only if engine requested
    ├── types.ts
    ├── state.ts
    ├── tools.ts
    ├── runner.ts
    ├── orchestrator.ts
    └── index.ts
```

---

## The Universal Gate Pattern

Every team follows the same gate logic regardless of domain:

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
[GATE 1: AUTHORITY] Reviews plan ← BLOCKING
  │ APPROVED             │
  │               REJECTED → Worker revises plan → resubmit
  ▼
[WORKER] Executes the approved plan, produces OUTPUT
  │
  ▼
[GATE 2: REVIEWER-A] Reviews output ← BLOCKING ┐
[GATE 2: REVIEWER-B] Reviews output ← BLOCKING ┘ parallel
  │ BOTH APPROVED        │
  │        ANY REJECTED → Worker fixes → only rejecting reviewer re-reviews
  ▼
TASK DONE
```

Rules that never change:
- No execution before plan approval
- Both output gates must pass in the same round
- On re-review, only the rejecting reviewer re-reviews
- Cross-consultation (worker asks authority mid-task) is always available
- Escalate after 3 rejection cycles

---

## Role Model Selection

| Role type | Model |
|---|---|
| Orchestrator (decomposes, monitors) | `claude-opus-4-6` |
| Quality authority (approves plans, consults) | `claude-opus-4-6` |
| Workers (primary domain work) | `claude-sonnet-4-6` |
| Reviewers (output validation) | `claude-sonnet-4-6` |

---

## Role Prompt Quality Bar

Every role prompt must produce agents that:
1. Know exactly what they are responsible for and nothing else
2. Know the exact JSON format they must output
3. Know what constitutes a blocking vs. non-blocking finding
4. Know what they must never do (prohibitions section)
5. Can operate autonomously on real artifacts without further guidance

The prompts are not documentation — they are operating instructions for an autonomous agent.

---

## Gate Record Pattern (all teams)

Every gate produces a record of this shape:

```json
{
  "gate": "<gate-name>",
  "task_id": "<id>",
  "decision": "APPROVED | REJECTED",
  "decided_by": "<role-id>",
  "decided_at": "<ISO timestamp>",
  "revision": 1,
  "summary": "<one sentence>",
  "findings": [
    {
      "severity": "blocking | warning | suggestion",
      "location": "<file or artifact reference>",
      "issue": "<what is wrong>",
      "fix": "<what must change>"
    }
  ]
}
```

- `decision` is always `APPROVED` or `REJECTED` — no in-between
- A gate with zero blocking findings may still be `APPROVED` with warnings
- A gate with any blocking finding must be `REJECTED`

---

## Cross-Consultation Pattern (all teams)

Any worker or reviewer can ask the quality authority a question mid-task.
The consultation is logged and does not pause the workflow clock.

```json
// Request
{
  "type": "cross_consultation",
  "consultation_id": "<id>",
  "task_id": "<id>",
  "from": "<worker-role>",
  "to": "<authority-role>",
  "question": "<specific question>",
  "context": "<relevant artifact or code>",
  "urgency": "blocking | non-blocking"
}

// Response
{
  "consultation_id": "<id>",
  "answer": "<direct answer>",
  "references": [{ "location": "<artifact>", "note": "<why>" }],
  "plan_amendment_required": false
}
```

---

## Domain Adaptation Guide

When adapting the pattern to a new domain, map these concepts:

| Dev team concept | General concept | Example (data science team) |
|---|---|---|
| CTO | Orchestrator | Project Lead |
| Architect | Quality Authority | Data Architect |
| Implementor | Primary Worker | Data Scientist |
| Code Reviewer | Output Reviewer A | Statistical Reviewer |
| Wiring Expert | Output Reviewer B | Pipeline Validator |
| Implementation plan | Work plan | Modeling plan |
| Code diff | Primary artifact | Model + analysis notebook |
| Code review | Output review A | Statistical validity review |
| Wiring trace | Output review B | Pipeline completeness trace |

The gate names change. The gate logic does not.

---

## CLAUDE.md Pattern for Parent Directory

When a parent directory contains multiple projects that should use this team, its `CLAUDE.md` must:

1. State the team's purpose in one paragraph
2. `@import` every role prompt using relative paths
3. Describe each workflow step with role announcements (`[ORCHESTRATOR]`, `[AUTHORITY]`, etc.)
4. State the gate rules as non-negotiable bullets

Claude Code reads `CLAUDE.md` from parent directories automatically.
A single `CLAUDE.md` at `~/sourceControl/` activates the team for all projects inside.
