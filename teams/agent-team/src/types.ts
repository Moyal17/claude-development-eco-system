import type { MessageParam, Tool } from '@anthropic-ai/sdk/resources/messages.js';

export type { MessageParam, Tool };

export type TaskStatus =
  | 'TASK_CREATED'
  | 'PLAN_IN_PROGRESS'
  | 'PLAN_UNDER_REVIEW'
  | 'IMPLEMENTATION_IN_PROGRESS'
  | 'IMPLEMENTATION_UNDER_REVIEW'
  | 'FIX_IN_PROGRESS'
  | 'FIX_UNDER_REVIEW'
  | 'TASK_DONE';

export type AgentId =
  | 'cto'
  | 'architect'
  | 'code_reviewer'
  | 'wiring_expert'
  | 'implementor_1'
  | 'implementor_2';

export type GateDecision = 'APPROVED' | 'REJECTED';

export interface Finding {
  severity: 'blocking' | 'warning' | 'suggestion';
  file?: string;
  line?: string;
  dimension?: string;
  category?: string;
  issue: string;
  fix: string;
  resolved?: boolean;
}

export interface GateRecord {
  decision: GateDecision;
  decided_by: AgentId;
  decided_at: string;
  summary: string;
  revision: number;
  findings?: Finding[];
  warnings?: Finding[];
  trace?: WiringTrace;
}

export interface WiringTrace {
  entrypoint: string;
  path: string[];
  terminal?: string;
  break_point?: string;
}

export interface PendingReviews {
  code_review_done: boolean;
  wiring_done: boolean;
  code_review_approved?: boolean;
  wiring_approved?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  assigned_implementor: 'implementor_1' | 'implementor_2';
  priority: 'critical' | 'high' | 'medium' | 'low';
  created_by: string;
  status: TaskStatus;
  depends_on_task_ids: string[];
  scope_boundaries?: string;
  known_risks: string[];
  estimated_files_touched: string[];
  gate_audit: {
    plan_approval?: GateRecord;
    code_review_approval?: GateRecord;
    wiring_approval?: GateRecord;
  };
  current_plan?: Record<string, unknown>;
  current_implementation?: Record<string, unknown>;
  review_revision: number;
  pending_reviews?: PendingReviews;
  rejection_cycles: number;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  task_id: string;
  from: AgentId;
  question: string;
  context: string;
  urgency: 'blocking' | 'non-blocking';
  answer?: string;
  answered_at?: string;
  submitted_at: string;
}

export interface TeamConfig {
  team: { name: string; version: string; description: string };
  agents: {
    cto: { id: string; model: string; system_prompt: string };
    architect: { id: string; model: string; system_prompt: string };
    code_reviewer: { id: string; model: string; system_prompt: string };
    wiring_expert: { id: string; model: string; system_prompt: string };
    implementors: Array<{ id: string; model: string; system_prompt: string; specializations: string[] }>;
  };
}
