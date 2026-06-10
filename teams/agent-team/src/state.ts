import fs from 'fs';
import path from 'path';
import type { Task, TaskStatus, GateRecord, Consultation, PendingReviews } from './types.js';

export class StateManager {
  private tasksDir: string;
  private consultationsDir: string;

  constructor(stateDir: string) {
    this.tasksDir = path.join(stateDir, 'tasks');
    this.consultationsDir = path.join(stateDir, 'consultations');
    fs.mkdirSync(this.tasksDir, { recursive: true });
    fs.mkdirSync(this.consultationsDir, { recursive: true });
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  saveTask(task: Task): void {
    const file = path.join(this.tasksDir, `${task.id}.json`);
    task.updated_at = new Date().toISOString();
    fs.writeFileSync(file, JSON.stringify(task, null, 2));
  }

  getTask(taskId: string): Task {
    const file = path.join(this.tasksDir, `${taskId}.json`);
    if (!fs.existsSync(file)) throw new Error(`Task not found: ${taskId}`);
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as Task;
  }

  getAllTasks(): Task[] {
    return fs
      .readdirSync(this.tasksDir)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(this.tasksDir, f), 'utf-8')) as Task);
  }

  updateTaskStatus(taskId: string, status: TaskStatus): Task {
    const task = this.getTask(taskId);
    task.status = status;
    this.saveTask(task);
    return task;
  }

  recordGate(taskId: string, gate: keyof Task['gate_audit'], record: GateRecord): Task {
    const task = this.getTask(taskId);
    task.gate_audit[gate] = record;
    this.saveTask(task);
    return task;
  }

  setPendingReviews(taskId: string, reviews: PendingReviews): Task {
    const task = this.getTask(taskId);
    task.pending_reviews = reviews;
    this.saveTask(task);
    return task;
  }

  updatePendingReview(
    taskId: string,
    reviewer: 'code_review' | 'wiring',
    approved: boolean
  ): Task {
    const task = this.getTask(taskId);
    if (!task.pending_reviews) throw new Error('No pending reviews on task');
    if (reviewer === 'code_review') {
      task.pending_reviews.code_review_done = true;
      task.pending_reviews.code_review_approved = approved;
    } else {
      task.pending_reviews.wiring_done = true;
      task.pending_reviews.wiring_approved = approved;
    }
    this.saveTask(task);
    return task;
  }

  nextTaskId(): string {
    const tasks = this.getAllTasks();
    const maxNum = tasks.reduce((max, t) => {
      const num = parseInt(t.id.replace('TASK-', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `TASK-${String(maxNum + 1).padStart(3, '0')}`;
  }

  // ── Consultations ─────────────────────────────────────────────────────────

  saveConsultation(c: Consultation): void {
    const file = path.join(this.consultationsDir, `${c.id}.json`);
    fs.writeFileSync(file, JSON.stringify(c, null, 2));
  }

  getConsultation(id: string): Consultation {
    const file = path.join(this.consultationsDir, `${id}.json`);
    if (!fs.existsSync(file)) throw new Error(`Consultation not found: ${id}`);
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as Consultation;
  }

  getOpenConsultations(taskId: string): Consultation[] {
    return fs
      .readdirSync(this.consultationsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(this.consultationsDir, f), 'utf-8')) as Consultation)
      .filter(c => c.task_id === taskId && !c.answer);
  }
}
