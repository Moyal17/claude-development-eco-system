import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

import { StateManager } from './state.js';
import { AgentRunner } from './runner.js';
import type { Task, TeamConfig } from './types.js';
import {
  CODEBASE_TOOLS,
  WRITE_TOOLS,
  PLAN_SUBMIT_TOOL,
  IMPLEMENTATION_SUBMIT_TOOL,
  CROSS_CONSULT_REQUEST_TOOL,
  PLAN_APPROVE_TOOL,
  PLAN_REJECT_TOOL,
  CROSS_CONSULT_RESPOND_TOOL,
  REVIEW_APPROVE_TOOL,
  REVIEW_REJECT_TOOL,
  WIRING_APPROVE_TOOL,
  WIRING_REJECT_TOOL,
  TASK_CREATE_TOOL,
  createCodebaseHandlers,
  createWriteHandlers,
  createWorkflowHandlers,
  createArchitectHandlers,
  createReviewerHandlers,
  createWiringHandlers,
  createCtoHandlers,
} from './tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEAM_ROOT = path.resolve(__dirname, '..');

export class Orchestrator {
  private config: TeamConfig;
  private state: StateManager;
  private runner: AgentRunner;
  private prompts: Record<string, string> = {};
  private projectDir: string;

  constructor(projectDir: string, stateDir?: string) {
    this.projectDir = projectDir;
    this.config = JSON.parse(fs.readFileSync(path.join(TEAM_ROOT, 'team.json'), 'utf-8')) as TeamConfig;
    const resolvedStateDir = stateDir ?? path.join(projectDir, '.agent-team');
    this.state = new StateManager(resolvedStateDir);
    this.runner = new AgentRunner();
    this.loadPrompts();
    console.log(chalk.gray(`State directory: ${resolvedStateDir}`));
  }

  private loadPrompts(): void {
    const promptsDir = path.join(TEAM_ROOT, 'prompts');
    for (const file of fs.readdirSync(promptsDir)) {
      if (!file.endsWith('.md')) continue;
      const key = file.replace('.md', '');
      this.prompts[key] = fs.readFileSync(path.join(promptsDir, file), 'utf-8');
    }
    // Also load the task decomposition prompt
    this.prompts['decomposition'] = fs.readFileSync(path.join(TEAM_ROOT, 'tasks', 'decomposition.md'), 'utf-8');
  }

  private prompt(key: string): string {
    if (!this.prompts[key]) throw new Error(`Prompt not found: ${key}`);
    return this.prompts[key];
  }

  private implementorConfig(id: 'implementor_1' | 'implementor_2') {
    return this.config.agents.implementors.find(i => i.id === id) ?? this.config.agents.implementors[0];
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Receive a user request, have the CTO decompose it, then execute all tasks. */
  async handleRequest(userRequest: string): Promise<void> {
    console.log(chalk.bold('\n══════════════════════════════════════════════════'));
    console.log(chalk.bold('  AGENT TEAM — Handling Request'));
    console.log(chalk.bold('══════════════════════════════════════════════════'));
    console.log(chalk.gray(`Project: ${this.projectDir}`));
    console.log(chalk.gray(`Request: ${userRequest}\n`));

    const tasksBefore = this.state.getAllTasks().map(t => t.id);
    await this.runCto(userRequest);
    const newTasks = this.state.getAllTasks().filter(t => !tasksBefore.includes(t.id));

    if (newTasks.length === 0) {
      console.log(chalk.yellow('CTO created no tasks. Done.'));
      return;
    }

    console.log(chalk.bold(`\nCTO created ${newTasks.length} task(s): ${newTasks.map(t => t.id).join(', ')}`));
    await this.executeTasks(newTasks);
  }

  /** Run all tasks in dependency order. */
  async executeTasks(tasks: Task[]): Promise<void> {
    // Simple topological sort: execute tasks whose dependencies are all DONE
    const remaining = [...tasks];
    const maxIterations = tasks.length * 2;
    let iterations = 0;

    while (remaining.length > 0 && iterations < maxIterations) {
      iterations++;
      const ready = remaining.filter(task => {
        const deps = task.depends_on_task_ids;
        return deps.every(depId => {
          const dep = this.state.getTask(depId);
          return dep.status === 'TASK_DONE';
        });
      });

      if (ready.length === 0) {
        console.log(chalk.red('No ready tasks — possible circular dependency. Aborting.'));
        break;
      }

      // Run ready tasks sequentially (could be parallelized if independent)
      for (const task of ready) {
        remaining.splice(remaining.indexOf(task), 1);
        await this.executeTask(task.id);
      }
    }
  }

  /** Execute a single task through the full gate workflow. */
  async executeTask(taskId: string): Promise<void> {
    console.log(chalk.bold(`\n${'═'.repeat(60)}`));
    console.log(chalk.bold(`  TASK ${taskId}`));
    console.log(chalk.bold(`${'═'.repeat(60)}`));

    let task = this.state.getTask(taskId);
    const MAX_REJECTION_CYCLES = 5;

    while (task.status !== 'TASK_DONE') {
      task = this.state.getTask(taskId); // always reload fresh

      switch (task.status) {
        case 'TASK_CREATED':
          this.state.updateTaskStatus(taskId, 'PLAN_IN_PROGRESS');
          break;

        case 'PLAN_IN_PROGRESS':
          await this.runImplementorPlanPhase(task);
          break;

        case 'PLAN_UNDER_REVIEW':
          await this.runArchitectPlanReview(task);
          break;

        case 'IMPLEMENTATION_IN_PROGRESS':
          await this.runImplementorCodePhase(task);
          break;

        case 'IMPLEMENTATION_UNDER_REVIEW':
        case 'FIX_UNDER_REVIEW':
          await this.runParallelReviews(task);
          break;

        case 'FIX_IN_PROGRESS':
          if (task.rejection_cycles >= MAX_REJECTION_CYCLES) {
            console.log(chalk.red(`Task ${taskId} has been rejected ${task.rejection_cycles} times. Escalating to user.`));
            this.printRejectionSummary(task);
            return;
          }
          await this.runImplementorFixPhase(task);
          break;

        default:
          console.log(chalk.red(`Unknown task status: ${task.status}`));
          return;
      }
    }

    console.log(chalk.bold.green(`\n✅ TASK ${taskId} — DONE`));
    this.printGateAuditTrail(task);
  }

  // ── CTO Phase ─────────────────────────────────────────────────────────────

  private async runCto(userRequest: string): Promise<void> {
    const { cto } = this.config.agents;
    const decompositionGuide = this.prompts['decomposition'];

    const message = `${decompositionGuide}\n\n---\n\n## User Request\n\n${userRequest}\n\nDecompose this request into tasks using the task_create tool. Create one task per logical unit of work.`;

    await this.runner.run({
      agentId: 'cto',
      model: cto.model,
      systemPrompt: this.prompt('cto'),
      tools: [TASK_CREATE_TOOL],
      toolHandlers: createCtoHandlers(this.state),
      initialMessage: message,
    });
  }

  // ── Implementor Plan Phase ─────────────────────────────────────────────────

  private async runImplementorPlanPhase(task: Task): Promise<void> {
    const implConfig = this.implementorConfig(task.assigned_implementor);
    const previousRejection = task.gate_audit.plan_approval?.decision === 'REJECTED'
      ? `\n\n## Previous Plan Rejection\n\n${JSON.stringify(task.gate_audit.plan_approval, null, 2)}\n\nAddress all concerns in your revised plan.`
      : '';

    const message = `## Your Task\n\n${JSON.stringify(task, null, 2)}\n\n## Your Phase: PLAN\n\nYou are in the planning phase. Use read_file, list_files, and search_code to explore the codebase thoroughly. Then write your implementation plan and submit it using the plan_submit tool.\n\nDo NOT write any code yet.${previousRejection}`;

    await this.runner.run({
      agentId: task.assigned_implementor,
      model: implConfig.model,
      systemPrompt: this.prompt('implementor'),
      tools: [...CODEBASE_TOOLS, PLAN_SUBMIT_TOOL, CROSS_CONSULT_REQUEST_TOOL],
      toolHandlers: {
        ...createCodebaseHandlers(this.projectDir),
        ...createWorkflowHandlers(this.state, task.id),
      },
      initialMessage: message,
    });
  }

  // ── Architect Plan Review ──────────────────────────────────────────────────

  private async runArchitectPlanReview(task: Task): Promise<void> {
    const { architect } = this.config.agents;

    // Handle any pending consultations first
    const openConsultations = this.state.getOpenConsultations(task.id);
    const consultationSection = openConsultations.length > 0
      ? `\n\n## Pending Consultations (answer these first using cross_consult_respond)\n\n${JSON.stringify(openConsultations, null, 2)}`
      : '';

    const message = `## Task: ${task.id} — ${task.title}\n\n### Acceptance Criteria\n${task.acceptance_criteria.map(c => `- ${c}`).join('\n')}\n\n### Submitted Implementation Plan\n\n${JSON.stringify(task.current_plan, null, 2)}${consultationSection}\n\nReview this plan against the codebase. Use read_file, list_files, and search_code to verify the plan's claims and check for architectural fit. Then call plan_approve or plan_reject.`;

    await this.runner.run({
      agentId: 'architect',
      model: architect.model,
      systemPrompt: this.prompt('architect'),
      tools: [...CODEBASE_TOOLS, PLAN_APPROVE_TOOL, PLAN_REJECT_TOOL, CROSS_CONSULT_RESPOND_TOOL],
      toolHandlers: {
        ...createCodebaseHandlers(this.projectDir),
        ...createArchitectHandlers(this.state),
      },
      initialMessage: message,
    });

    // After architect finishes, check if plan was rejected to increment cycle counter
    const updated = this.state.getTask(task.id);
    if (updated.gate_audit.plan_approval?.decision === 'REJECTED') {
      updated.rejection_cycles += 1;
      this.state.saveTask(updated);
      console.log(chalk.yellow(`  Plan rejected (cycle ${updated.rejection_cycles}). Implementor will revise.`));
    } else {
      console.log(chalk.green('  ✓ Plan approved by architect'));
    }
  }

  // ── Implementor Code Phase ─────────────────────────────────────────────────

  private async runImplementorCodePhase(task: Task): Promise<void> {
    const implConfig = this.implementorConfig(task.assigned_implementor);

    const message = `## Task: ${task.id} — ${task.title}\n\n### Accepted Plan\n\n${JSON.stringify(task.current_plan, null, 2)}\n\n### Acceptance Criteria\n${task.acceptance_criteria.map(c => `- ${c}`).join('\n')}\n\n## Your Phase: IMPLEMENT\n\nYour plan has been approved. Now implement it exactly as written. Use write_file and edit_file to make changes. Run tests with run_command. When done, submit using implementation_submit.`;

    await this.runner.run({
      agentId: task.assigned_implementor,
      model: implConfig.model,
      systemPrompt: this.prompt('implementor'),
      tools: [...CODEBASE_TOOLS, ...WRITE_TOOLS, IMPLEMENTATION_SUBMIT_TOOL, CROSS_CONSULT_REQUEST_TOOL],
      toolHandlers: {
        ...createCodebaseHandlers(this.projectDir),
        ...createWriteHandlers(this.projectDir),
        ...createWorkflowHandlers(this.state, task.id),
      },
      initialMessage: message,
    });
  }

  // ── Parallel Reviews ───────────────────────────────────────────────────────

  private async runParallelReviews(task: Task): Promise<void> {
    // Determine which reviewers need to run (on re-review, only those who rejected)
    const isReReview = task.status === 'FIX_UNDER_REVIEW';
    const prevCodeReview = task.gate_audit.code_review_approval;
    const prevWiring = task.gate_audit.wiring_approval;

    const runCodeReview = !isReReview || prevCodeReview?.decision === 'REJECTED';
    const runWiring = !isReReview || prevWiring?.decision === 'REJECTED';

    // Initialize pending review state
    this.state.setPendingReviews(task.id, {
      code_review_done: !runCodeReview,
      wiring_done: !runWiring,
      code_review_approved: runCodeReview ? undefined : (prevCodeReview?.decision === 'APPROVED'),
      wiring_approved: runWiring ? undefined : (prevWiring?.decision === 'APPROVED'),
    });

    console.log(chalk.bold(`\n  Running parallel reviews (code_review: ${runCodeReview}, wiring: ${runWiring})`));

    const reviewPromises: Promise<void>[] = [];

    if (runCodeReview) {
      reviewPromises.push(this.runCodeReview(task));
    }
    if (runWiring) {
      reviewPromises.push(this.runWiringReview(task));
    }

    await Promise.all(reviewPromises);

    // Evaluate combined gate result
    const finalTask = this.state.getTask(task.id);
    const pending = finalTask.pending_reviews!;
    const allApproved = pending.code_review_approved && pending.wiring_approved;

    if (allApproved) {
      finalTask.status = 'TASK_DONE';
      this.state.saveTask(finalTask);
      console.log(chalk.green('\n  ✓ Both review gates passed'));
    } else {
      finalTask.status = 'FIX_IN_PROGRESS';
      finalTask.rejection_cycles += 1;
      this.state.saveTask(finalTask);

      const reasons: string[] = [];
      if (!pending.code_review_approved) reasons.push('code_reviewer');
      if (!pending.wiring_approved) reasons.push('wiring_expert');
      console.log(chalk.yellow(`\n  ✗ Rejected by: ${reasons.join(', ')} (cycle ${finalTask.rejection_cycles})`));
    }
  }

  private async runCodeReview(task: Task): Promise<void> {
    const { code_reviewer } = this.config.agents;

    const prevFindings = task.gate_audit.code_review_approval?.findings
      ? `\n\n## Previous Findings (verify these are fixed)\n\n${JSON.stringify(task.gate_audit.code_review_approval.findings, null, 2)}`
      : '';

    const message = `## Task: ${task.id} — ${task.title}\n\n### Acceptance Criteria\n${task.acceptance_criteria.map(c => `- ${c}`).join('\n')}\n\n### Implementation Submitted\n\n${JSON.stringify(task.current_implementation, null, 2)}${prevFindings}\n\nReview the implementation artifacts for quality, functionality, and security. Use read_file, list_files, and search_code to examine the code. Then call review_approve or review_reject with your findings.`;

    await this.runner.run({
      agentId: 'code_reviewer',
      model: code_reviewer.model,
      systemPrompt: this.prompt('code_reviewer'),
      tools: [...CODEBASE_TOOLS, REVIEW_APPROVE_TOOL, REVIEW_REJECT_TOOL],
      toolHandlers: {
        ...createCodebaseHandlers(this.projectDir),
        ...createReviewerHandlers(this.state),
      },
      initialMessage: message,
    });
  }

  private async runWiringReview(task: Task): Promise<void> {
    const { wiring_expert } = this.config.agents;

    const prevFindings = task.gate_audit.wiring_approval?.findings
      ? `\n\n## Previous Wiring Findings (verify these are fixed)\n\n${JSON.stringify(task.gate_audit.wiring_approval.findings, null, 2)}`
      : '';

    const message = `## Task: ${task.id} — ${task.title}\n\n### Acceptance Criteria\n${task.acceptance_criteria.map(c => `- ${c}`).join('\n')}\n\n### Implementation Submitted\n\n${JSON.stringify(task.current_implementation, null, 2)}${prevFindings}\n\nTrace this feature from entrypoint to terminal effect. Verify it is fully wired, has no dead code, and is production-ready. Use read_file, list_files, and search_code. Then call wiring_approve or wiring_reject with your trace and findings.`;

    await this.runner.run({
      agentId: 'wiring_expert',
      model: this.config.agents.wiring_expert.model,
      systemPrompt: this.prompt('wiring_expert'),
      tools: [...CODEBASE_TOOLS, WIRING_APPROVE_TOOL, WIRING_REJECT_TOOL],
      toolHandlers: {
        ...createCodebaseHandlers(this.projectDir),
        ...createWiringHandlers(this.state),
      },
      initialMessage: message,
    });
  }

  // ── Implementor Fix Phase ──────────────────────────────────────────────────

  private async runImplementorFixPhase(task: Task): Promise<void> {
    const implConfig = this.implementorConfig(task.assigned_implementor);

    const codeFindings = task.gate_audit.code_review_approval?.decision === 'REJECTED'
      ? `\n\n### Code Review Findings\n\n${JSON.stringify(task.gate_audit.code_review_approval.findings, null, 2)}`
      : '';
    const wiringFindings = task.gate_audit.wiring_approval?.decision === 'REJECTED'
      ? `\n\n### Wiring Expert Findings\n\n${JSON.stringify(task.gate_audit.wiring_approval.findings, null, 2)}`
      : '';

    const message = `## Task: ${task.id} — ${task.title}\n\n## Your Phase: FIX\n\nYour implementation was rejected. Address ALL blocking findings below, then resubmit using implementation_submit.${codeFindings}${wiringFindings}\n\nDo not introduce new scope. Only fix what was flagged.`;

    // Set status to allow the submit tool to work
    task.status = 'FIX_UNDER_REVIEW'; // will be set by implementation_submit handler
    this.state.updateTaskStatus(task.id, 'FIX_IN_PROGRESS');

    await this.runner.run({
      agentId: task.assigned_implementor,
      model: implConfig.model,
      systemPrompt: this.prompt('implementor'),
      tools: [...CODEBASE_TOOLS, ...WRITE_TOOLS, IMPLEMENTATION_SUBMIT_TOOL, CROSS_CONSULT_REQUEST_TOOL],
      toolHandlers: {
        ...createCodebaseHandlers(this.projectDir),
        ...createWriteHandlers(this.projectDir),
        ...createWorkflowHandlers(this.state, task.id),
      },
      initialMessage: message,
    });

    // After implementor submits, set to FIX_UNDER_REVIEW for re-review
    const updated = this.state.getTask(task.id);
    if (updated.status === 'IMPLEMENTATION_UNDER_REVIEW') {
      this.state.updateTaskStatus(task.id, 'FIX_UNDER_REVIEW');
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private printGateAuditTrail(task: Task): void {
    console.log(chalk.bold('\n  Gate Audit Trail:'));
    const { gate_audit } = task;
    const gates = ['plan_approval', 'code_review_approval', 'wiring_approval'] as const;
    for (const gate of gates) {
      const record = gate_audit[gate];
      if (record) {
        const icon = record.decision === 'APPROVED' ? '✓' : '✗';
        const color = record.decision === 'APPROVED' ? chalk.green : chalk.red;
        console.log(color(`  ${icon} ${gate}: ${record.decision} by ${record.decided_by} at ${record.decided_at}`));
      }
    }
  }

  private printRejectionSummary(task: Task): void {
    console.log(chalk.red(`\n  Task ${task.id} escalated after ${task.rejection_cycles} rejection cycles.`));
    console.log(chalk.red('  Manual intervention required. Review findings:'));
    if (task.gate_audit.code_review_approval?.findings?.length) {
      console.log(chalk.red('\n  Code Review findings:'));
      for (const f of task.gate_audit.code_review_approval.findings) {
        console.log(chalk.red(`    [${f.severity}] ${f.file ?? ''}:${f.line ?? ''} — ${f.issue}`));
      }
    }
    if (task.gate_audit.wiring_approval?.findings?.length) {
      console.log(chalk.red('\n  Wiring findings:'));
      for (const f of task.gate_audit.wiring_approval.findings) {
        console.log(chalk.red(`    [${f.severity}] ${f.file ?? ''}:${f.line ?? ''} — ${f.issue}`));
      }
    }
  }

  /** Show status of all tasks in state. */
  showStatus(): void {
    const tasks = this.state.getAllTasks();
    if (tasks.length === 0) {
      console.log(chalk.yellow('No tasks in state.'));
      return;
    }
    console.log(chalk.bold('\nTask Status:'));
    for (const t of tasks) {
      const statusColor =
        t.status === 'TASK_DONE' ? chalk.green :
        t.status.includes('REJECTED') || t.status === 'FIX_IN_PROGRESS' ? chalk.red :
        t.status.includes('REVIEW') ? chalk.yellow :
        chalk.white;
      console.log(`  ${t.id}  ${statusColor(t.status.padEnd(30))}  ${t.title}`);
    }
  }
}
