# team.json Template

Use this as the structural template for every generated `team.json`.
Replace all `<placeholders>` with domain-specific values.

---

```json
{
  "$schema": "https://your-org/agent-team-schema/v1",
  "team": {
    "name": "<Human-readable team name>",
    "version": "1.0.0",
    "description": "<One sentence: what this team does and why it exists>"
  },

  "agents": {
    "<orchestrator-id>": {
      "id": "<orchestrator-id>",
      "role": "<Orchestrator Role Title>",
      "model": "claude-opus-4-6",
      "system_prompt": "prompts/<orchestrator-id>.md",
      "tools": ["task_create", "task_assign", "task_status"],
      "responsibilities": [
        "Decompose user requests into discrete tasks",
        "Assign tasks to workers",
        "Monitor workflow state",
        "Enforce gate protocol",
        "Close tasks only after full gate audit trail"
      ]
    },

    "<authority-id>": {
      "id": "<authority-id>",
      "role": "<Authority Role Title>",
      "model": "claude-opus-4-6",
      "system_prompt": "prompts/<authority-id>.md",
      "tools": [
        "codebase_read",
        "plan_approve",
        "plan_reject",
        "cross_consult_respond"
      ],
      "gate_authority": ["plan_approval"],
      "available_for_consultation": true
    },

    "<worker-id>": {
      "id": "<worker-id>",
      "role": "<Worker Role Title>",
      "model": "claude-sonnet-4-6",
      "system_prompt": "prompts/<worker-id>.md",
      "tools": [
        "read_context",
        "plan_submit",
        "output_submit",
        "cross_consult_request"
      ]
    },

    "<reviewer-a-id>": {
      "id": "<reviewer-a-id>",
      "role": "<Reviewer A Role Title>",
      "model": "claude-sonnet-4-6",
      "system_prompt": "prompts/<reviewer-a-id>.md",
      "tools": [
        "read_context",
        "<gate-a>_approve",
        "<gate-a>_reject"
      ],
      "gate_authority": ["<gate-a>_approval"],
      "runs_parallel_with": ["<reviewer-b-id>"]
    },

    "<reviewer-b-id>": {
      "id": "<reviewer-b-id>",
      "role": "<Reviewer B Role Title>",
      "model": "claude-sonnet-4-6",
      "system_prompt": "prompts/<reviewer-b-id>.md",
      "tools": [
        "read_context",
        "<gate-b>_approve",
        "<gate-b>_reject"
      ],
      "gate_authority": ["<gate-b>_approval"],
      "runs_parallel_with": ["<reviewer-a-id>"]
    }
  },

  "workflow": {
    "task_lifecycle": [
      {
        "stage": "TASK_CREATED",
        "owner": "<orchestrator-id>",
        "transitions_to": "PLAN_IN_PROGRESS"
      },
      {
        "stage": "PLAN_IN_PROGRESS",
        "owner": "<worker-id>",
        "transitions_to": "PLAN_UNDER_REVIEW",
        "trigger": "plan_submit"
      },
      {
        "stage": "PLAN_UNDER_REVIEW",
        "owner": "<authority-id>",
        "gate": "plan_approval",
        "blocking": true,
        "on_approve": "EXECUTION_IN_PROGRESS",
        "on_reject": "PLAN_IN_PROGRESS"
      },
      {
        "stage": "EXECUTION_IN_PROGRESS",
        "owner": "<worker-id>",
        "transitions_to": "OUTPUT_UNDER_REVIEW",
        "trigger": "output_submit"
      },
      {
        "stage": "OUTPUT_UNDER_REVIEW",
        "owners": ["<reviewer-a-id>", "<reviewer-b-id>"],
        "parallel": true,
        "gates": ["<gate-a>_approval", "<gate-b>_approval"],
        "blocking": true,
        "on_all_approve": "TASK_DONE",
        "on_any_reject": "FIX_IN_PROGRESS"
      },
      {
        "stage": "FIX_IN_PROGRESS",
        "owner": "<worker-id>",
        "transitions_to": "FIX_UNDER_REVIEW",
        "trigger": "output_submit"
      },
      {
        "stage": "FIX_UNDER_REVIEW",
        "note": "Only reviewers who previously rejected re-review. Loop repeats until all gates pass.",
        "owners": ["<reviewer-a-id>", "<reviewer-b-id>"],
        "only_rejecting_reviewers": true,
        "parallel": true,
        "gates": ["<gate-a>_approval", "<gate-b>_approval"],
        "blocking": true,
        "on_all_approve": "TASK_DONE",
        "on_any_reject": "FIX_IN_PROGRESS"
      },
      {
        "stage": "TASK_DONE",
        "owner": "<orchestrator-id>",
        "terminal": true,
        "requires_gate_audit_trail": true
      }
    ]
  },

  "gates": {
    "plan_approval": {
      "authority": "<authority-id>",
      "approve_tool": "plan_approve",
      "reject_tool": "plan_reject",
      "reject_reason_required": true
    },
    "<gate-a>_approval": {
      "authority": "<reviewer-a-id>",
      "approve_tool": "<gate-a>_approve",
      "reject_tool": "<gate-a>_reject",
      "reject_findings_required": true
    },
    "<gate-b>_approval": {
      "authority": "<reviewer-b-id>",
      "approve_tool": "<gate-b>_approve",
      "reject_tool": "<gate-b>_reject",
      "reject_findings_required": true
    }
  },

  "cross_consultation": {
    "requester_roles": ["<worker-id>", "<reviewer-a-id>", "<reviewer-b-id>"],
    "responder": "<authority-id>",
    "request_tool": "cross_consult_request",
    "respond_tool": "cross_consult_respond",
    "logged_in_task_audit": true
  },

  "schemas": {
    "task": "schemas/task.schema.json",
    "plan": "schemas/plan.schema.json",
    "<gate-a>_report": "schemas/<gate-a>_report.schema.json",
    "<gate-b>_report": "schemas/<gate-b>_report.schema.json"
  },

  "tool_schemas": {
    "plan_submit": "tools/schemas/plan_submit.json",
    "plan_approve": "tools/schemas/plan_approve.json",
    "plan_reject": "tools/schemas/plan_reject.json",
    "output_submit": "tools/schemas/output_submit.json",
    "<gate-a>_approve": "tools/schemas/<gate-a>_approve.json",
    "<gate-a>_reject": "tools/schemas/<gate-a>_reject.json",
    "<gate-b>_approve": "tools/schemas/<gate-b>_approve.json",
    "<gate-b>_reject": "tools/schemas/<gate-b>_reject.json",
    "cross_consult_request": "tools/schemas/cross_consult_request.json",
    "cross_consult_respond": "tools/schemas/cross_consult_respond.json"
  },

  "audit": {
    "log_all_gate_decisions": true,
    "log_all_cross_consultations": true,
    "require_rejection_reason": true,
    "immutable_approval_trail": true,
    "escalate_after_rejection_cycles": 3
  }
}
```
