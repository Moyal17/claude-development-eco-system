import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import fg from 'fast-glob';
import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import type { StateManager } from './state.js';
import type { Task, AgentId, Consultation, GateRecord, Finding, WiringTrace } from './types.js';

// ── Tool definitions (sent to Claude API) ────────────────────────────────────

export const CODEBASE_TOOLS: Tool[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file in the project',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the project root' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_files',
    description: 'List files matching a glob pattern in the project',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern e.g. "src/**/*.ts"' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'search_code',
    description: 'Search for a regex pattern across project files',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regex pattern to search for' },
        path: { type: 'string', description: 'Directory to search in (defaults to project root)' },
      },
      required: ['pattern'],
    },
  },
];

export const WRITE_TOOLS: Tool[] = [
  {
    name: 'write_file',
    description: 'Write or overwrite a file in the project',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        content: { type: 'string', description: 'Full content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: 'Replace a specific string in a file (must be unique in the file)',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        old_string: { type: 'string', description: 'The exact string to replace' },
        new_string: { type: 'string', description: 'The replacement string' },
      },
      required: ['path', 'old_string', 'new_string'],
    },
  },
  {
    name: 'run_command',
    description: 'Run a shell command in the project directory (e.g. to run tests)',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
      },
      required: ['command'],
    },
  },
];

export const PLAN_SUBMIT_TOOL: Tool = {
  name: 'plan_submit',
  description: 'Submit your implementation plan to the architect for approval. Do not write any code until the plan is approved.',
  input_schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string' },
      plan: {
        type: 'object',
        description: 'The full implementation plan',
        properties: {
          plan_version: { type: 'string' },
          revision: { type: 'number' },
          summary: { type: 'string' },
          files_to_modify: { type: 'array', items: { type: 'object' } },
          files_to_create: { type: 'array', items: { type: 'object' } },
          data_flow: { type: 'string' },
          edge_cases: { type: 'array', items: { type: 'object' } },
          test_plan: { type: 'string' },
          dependencies: { type: 'array', items: { type: 'object' } },
          risk_flags: { type: 'array', items: { type: 'object' } },
        },
        required: ['summary', 'files_to_modify', 'files_to_create', 'data_flow', 'edge_cases', 'test_plan'],
      },
    },
    required: ['task_id', 'plan'],
  },
};

export const IMPLEMENTATION_SUBMIT_TOOL: Tool = {
  name: 'implementation_submit',
  description: 'Submit your completed implementation for code review and wiring review.',
  input_schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string' },
      files_changed: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            action: { type: 'string', enum: ['created', 'modified', 'deleted'] },
          },
        },
      },
      summary_of_changes: { type: 'string' },
      test_results: {
        type: 'object',
        properties: {
          passed: { type: 'number' },
          failed: { type: 'number' },
          command: { type: 'string' },
        },
      },
      fix_notes: { type: 'string', description: 'On resubmission: what was changed to address rejections' },
    },
    required: ['task_id', 'files_changed', 'summary_of_changes'],
  },
};

export const CROSS_CONSULT_REQUEST_TOOL: Tool = {
  name: 'cross_consult_request',
  description: 'Request an architectural opinion from the architect. Use when you hit ambiguity that could affect correctness or architecture.',
  input_schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string' },
      question: { type: 'string', description: 'Specific, context-rich architectural question' },
      context: { type: 'string', description: 'Relevant code snippets or constraints' },
      urgency: { type: 'string', enum: ['blocking', 'non-blocking'], default: 'blocking' },
    },
    required: ['task_id', 'question', 'context'],
  },
};

export const PLAN_APPROVE_TOOL: Tool = {
  name: 'plan_approve',
  description: 'Approve the implementor\'s plan. This unblocks the implementor to begin writing code.',
  input_schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string' },
      plan_version: { type: 'string' },
      summary: { type: 'string', description: 'Why the plan is approved' },
      warnings: { type: 'array', items: { type: 'object' }, description: 'Non-blocking concerns' },
    },
    required: ['task_id', 'plan_version', 'summary'],
  },
};

export const PLAN_REJECT_TOOL: Tool = {
  name: 'plan_reject',
  description: 'Reject the implementor\'s plan. Implementor must revise and resubmit.',
  input_schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string' },
      plan_version: { type: 'string' },
      summary: { type: 'string' },
      concerns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['blocking', 'warning'] },
            area: { type: 'string' },
            detail: { type: 'string' },
            suggested_fix: { type: 'string' },
          },
          required: ['severity', 'area', 'detail', 'suggested_fix'],
        },
      },
    },
    required: ['task_id', 'plan_version', 'summary', 'concerns'],
  },
};

export const CROSS_CONSULT_RESPOND_TOOL: Tool = {
  name: 'cross_consult_respond',
  description: 'Respond to a cross-consultation request from a team member.',
  input_schema: {
    type: 'object',
    properties: {
      consultation_id: { type: 'string' },
      task_id: { type: 'string' },
      answer: { type: 'string' },
      references: { type: 'array', items: { type: 'object' } },
      plan_amendment_required: { type: 'boolean', default: false },
    },
    required: ['consultation_id', 'task_id', 'answer'],
  },
};

export const REVIEW_APPROVE_TOOL: Tool = {
  name: 'review_approve',
  description: 'Approve the implementation from a code quality, functionality, and security perspective.',
  input_schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string' },
      revision: { type: 'number' },
      summary: { type: 'string' },
      warnings: { type: 'array', items: { type: 'object' } },
    },
    required: ['task_id', 'revision', 'summary'],
  },
};

export const REVIEW_REJECT_TOOL: Tool = {
  name: 'review_reject',
  description: 'Reject the implementation due to code quality, functionality, or security findings.',
  input_schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string' },
      revision: { type: 'number' },
      summary: { type: 'string' },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['blocking', 'warning', 'suggestion'] },
            file: { type: 'string' },
            line: { type: 'string' },
            dimension: { type: 'string' },
            issue: { type: 'string' },
            fix: { type: 'string' },
          },
          required: ['severity', 'issue', 'fix'],
        },
      },
    },
    required: ['task_id', 'revision', 'summary', 'findings'],
  },
};

export const WIRING_APPROVE_TOOL: Tool = {
  name: 'wiring_approve',
  description: 'Approve the implementation from an end-to-end wiring and production-readiness perspective. A trace is required.',
  input_schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string' },
      revision: { type: 'number' },
      summary: { type: 'string' },
      trace: {
        type: 'object',
        properties: {
          entrypoint: { type: 'string' },
          path: { type: 'array', items: { type: 'string' } },
          terminal: { type: 'string' },
        },
        required: ['entrypoint', 'path', 'terminal'],
      },
      warnings: { type: 'array', items: { type: 'object' } },
    },
    required: ['task_id', 'revision', 'summary', 'trace'],
  },
};

export const WIRING_REJECT_TOOL: Tool = {
  name: 'wiring_reject',
  description: 'Reject the implementation due to broken wiring, dead code, regressions, or production-readiness failures.',
  input_schema: {
    type: 'object',
    properties: {
      task_id: { type: 'string' },
      revision: { type: 'number' },
      summary: { type: 'string' },
      trace: {
        type: 'object',
        properties: {
          entrypoint: { type: 'string' },
          path: { type: 'array', items: { type: 'string' } },
          break_point: { type: 'string', description: 'Where the trace breaks' },
        },
        required: ['entrypoint', 'path'],
      },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['blocking', 'warning'] },
            category: { type: 'string' },
            file: { type: 'string' },
            line: { type: 'string' },
            issue: { type: 'string' },
            fix: { type: 'string' },
          },
          required: ['severity', 'issue', 'fix'],
        },
      },
    },
    required: ['task_id', 'revision', 'summary', 'trace', 'findings'],
  },
};

export const TASK_CREATE_TOOL: Tool = {
  name: 'task_create',
  description: 'Create a new engineering task and assign it to an implementor.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      acceptance_criteria: { type: 'array', items: { type: 'string' } },
      assigned_implementor: { type: 'string', enum: ['implementor_1', 'implementor_2'] },
      priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
      depends_on_task_ids: { type: 'array', items: { type: 'string' } },
      scope_boundaries: { type: 'string' },
      known_risks: { type: 'array', items: { type: 'string' } },
      estimated_files_touched: { type: 'array', items: { type: 'string' } },
    },
    required: ['title', 'description', 'acceptance_criteria', 'assigned_implementor', 'priority'],
  },
};

// ── Tool handlers (actual implementations) ───────────────────────────────────

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export function createCodebaseHandlers(projectDir: string): Record<string, ToolHandler> {
  return {
    read_file: async ({ path: filePath }) => {
      const full = path.resolve(projectDir, filePath as string);
      if (!fs.existsSync(full)) return { error: `File not found: ${filePath}` };
      return { content: fs.readFileSync(full, 'utf-8') };
    },

    list_files: async ({ pattern }) => {
      const files = await fg(pattern as string, { cwd: projectDir, dot: true });
      return { files };
    },

    search_code: async ({ pattern, path: searchPath }) => {
      const cwd = searchPath ? path.resolve(projectDir, searchPath as string) : projectDir;
      try {
        const result = execSync(`grep -rn "${pattern}" .`, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return { matches: result.trim().split('\n').filter(Boolean) };
      } catch {
        return { matches: [] };
      }
    },
  };
}

export function createWriteHandlers(projectDir: string): Record<string, ToolHandler> {
  return {
    write_file: async ({ path: filePath, content }) => {
      const full = path.resolve(projectDir, filePath as string);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content as string);
      return { written: true, path: filePath };
    },

    edit_file: async ({ path: filePath, old_string, new_string }) => {
      const full = path.resolve(projectDir, filePath as string);
      if (!fs.existsSync(full)) return { error: `File not found: ${filePath}` };
      const current = fs.readFileSync(full, 'utf-8');
      if (!current.includes(old_string as string)) return { error: 'old_string not found in file' };
      fs.writeFileSync(full, current.replace(old_string as string, new_string as string));
      return { edited: true };
    },

    run_command: async ({ command }) => {
      try {
        const output = execSync(command as string, { cwd: projectDir, encoding: 'utf-8', timeout: 60000 });
        return { success: true, output };
      } catch (err: unknown) {
        const e = err as { stdout?: string; stderr?: string; message?: string };
        return { success: false, stdout: e.stdout ?? '', stderr: e.stderr ?? '', message: e.message };
      }
    },
  };
}

export function createWorkflowHandlers(
  state: StateManager,
  taskId: string,
  onPlanSubmitted?: () => void,
  onImplementationSubmitted?: () => void,
): Record<string, ToolHandler> {
  return {
    plan_submit: async ({ task_id, plan }) => {
      const task = state.getTask(task_id as string);
      task.current_plan = plan as Record<string, unknown>;
      task.status = 'PLAN_UNDER_REVIEW';
      state.saveTask(task);
      onPlanSubmitted?.();
      return { submitted: true, plan_version: (plan as Record<string, unknown>).plan_version, message: 'Plan submitted to architect for review.' };
    },

    implementation_submit: async ({ task_id, files_changed, summary_of_changes, test_results, fix_notes }) => {
      const task = state.getTask(task_id as string);
      task.current_implementation = { files_changed, summary_of_changes, test_results, fix_notes, submitted_at: new Date().toISOString() };
      task.status = 'IMPLEMENTATION_UNDER_REVIEW';
      task.review_revision += 1;
      state.saveTask(task);
      onImplementationSubmitted?.();
      return { submitted: true, new_task_status: 'IMPLEMENTATION_UNDER_REVIEW', reviews_triggered: ['code_reviewer', 'wiring_expert'] };
    },

    cross_consult_request: async ({ task_id, question, context, urgency }) => {
      const id = `CONSULT-${Date.now()}`;
      const consultation = {
        id,
        task_id: task_id as string,
        from: 'implementor_1' as AgentId,
        question: question as string,
        context: context as string,
        urgency: (urgency as 'blocking' | 'non-blocking') ?? 'blocking',
        submitted_at: new Date().toISOString(),
      };
      state.saveConsultation(consultation);
      return { submitted: true, consultation_id: id, message: 'Consultation request sent to architect.' };
    },
  };
}

export function createArchitectHandlers(state: StateManager): Record<string, ToolHandler> {
  return {
    plan_approve: async ({ task_id, plan_version, summary, warnings }) => {
      const task = state.getTask(task_id as string);
      const record: GateRecord = {
        decision: 'APPROVED',
        decided_by: 'architect',
        decided_at: new Date().toISOString(),
        summary: summary as string,
        revision: 1,
        warnings: (warnings as Finding[] | undefined) ?? [],
      };
      task.gate_audit.plan_approval = record;
      task.status = 'IMPLEMENTATION_IN_PROGRESS';
      state.saveTask(task);
      return { approved: true, task_id, new_task_status: 'IMPLEMENTATION_IN_PROGRESS' };
    },

    plan_reject: async ({ task_id, plan_version, summary, concerns }) => {
      const task = state.getTask(task_id as string);
      const record: GateRecord = {
        decision: 'REJECTED',
        decided_by: 'architect',
        decided_at: new Date().toISOString(),
        summary: summary as string,
        revision: 1,
        findings: concerns as Finding[],
      };
      task.gate_audit.plan_approval = record;
      task.status = 'PLAN_IN_PROGRESS';
      state.saveTask(task);
      return { rejected: true, task_id, new_task_status: 'PLAN_IN_PROGRESS' };
    },

    cross_consult_respond: async ({ consultation_id, task_id, answer, references, plan_amendment_required }) => {
      const c = state.getConsultation(consultation_id as string);
      c.answer = answer as string;
      c.answered_at = new Date().toISOString();
      state.saveConsultation(c);
      return { delivered: true, consultation_id, plan_amendment_required: plan_amendment_required ?? false };
    },
  };
}

export function createReviewerHandlers(state: StateManager): Record<string, ToolHandler> {
  return {
    review_approve: async ({ task_id, revision, summary, warnings }) => {
      const record: GateRecord = {
        decision: 'APPROVED',
        decided_by: 'code_reviewer',
        decided_at: new Date().toISOString(),
        summary: summary as string,
        revision: revision as number,
        warnings: (warnings as Finding[] | undefined) ?? [],
      };
      state.recordGate(task_id as string, 'code_review_approval', record);
      state.updatePendingReview(task_id as string, 'code_review', true);
      return { gate: 'code_review_approval', approved: true, task_id };
    },

    review_reject: async ({ task_id, revision, summary, findings }) => {
      const record: GateRecord = {
        decision: 'REJECTED',
        decided_by: 'code_reviewer',
        decided_at: new Date().toISOString(),
        summary: summary as string,
        revision: revision as number,
        findings: findings as Finding[],
      };
      state.recordGate(task_id as string, 'code_review_approval', record);
      state.updatePendingReview(task_id as string, 'code_review', false);
      return { gate: 'code_review_approval', rejected: true, task_id };
    },
  };
}

export function createWiringHandlers(state: StateManager): Record<string, ToolHandler> {
  return {
    wiring_approve: async ({ task_id, revision, summary, trace, warnings }) => {
      const record: GateRecord = {
        decision: 'APPROVED',
        decided_by: 'wiring_expert',
        decided_at: new Date().toISOString(),
        summary: summary as string,
        revision: revision as number,
        trace: trace as WiringTrace,
        warnings: (warnings as Finding[] | undefined) ?? [],
      };
      state.recordGate(task_id as string, 'wiring_approval', record);
      state.updatePendingReview(task_id as string, 'wiring', true);
      return { gate: 'wiring_approval', approved: true, task_id };
    },

    wiring_reject: async ({ task_id, revision, summary, trace, findings }) => {
      const record: GateRecord = {
        decision: 'REJECTED',
        decided_by: 'wiring_expert',
        decided_at: new Date().toISOString(),
        summary: summary as string,
        revision: revision as number,
        trace: trace as WiringTrace,
        findings: findings as Finding[],
      };
      state.recordGate(task_id as string, 'wiring_approval', record);
      state.updatePendingReview(task_id as string, 'wiring', false);
      return { gate: 'wiring_approval', rejected: true, task_id };
    },
  };
}

export function createCtoHandlers(state: StateManager): Record<string, ToolHandler> {
  return {
    task_create: async ({ title, description, acceptance_criteria, assigned_implementor, priority, depends_on_task_ids, scope_boundaries, known_risks, estimated_files_touched }) => {
      const id = state.nextTaskId();
      const now = new Date().toISOString();
      const task = {
        id,
        title: title as string,
        description: description as string,
        acceptance_criteria: (acceptance_criteria as string[]) ?? [],
        assigned_implementor: (assigned_implementor as 'implementor_1' | 'implementor_2') ?? 'implementor_1',
        priority: (priority as 'critical' | 'high' | 'medium' | 'low') ?? 'medium',
        created_by: 'cto',
        status: 'TASK_CREATED' as const,
        depends_on_task_ids: (depends_on_task_ids as string[]) ?? [],
        scope_boundaries: scope_boundaries as string | undefined,
        known_risks: (known_risks as string[]) ?? [],
        estimated_files_touched: (estimated_files_touched as string[]) ?? [],
        gate_audit: {},
        review_revision: 0,
        rejection_cycles: 0,
        created_at: now,
        updated_at: now,
      };
      state.saveTask(task);
      return { created: true, task_id: id, task };
    },
  };
}
