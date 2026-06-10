#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { Orchestrator } from './orchestrator.js';

const program = new Command();

program
  .name('agent-team')
  .description('Multi-agent engineering team orchestration engine')
  .version('1.0.0');

program
  .command('request <text>')
  .description('Submit a request for the team to handle')
  .option('-p, --project <dir>', 'Path to the project directory', process.cwd())
  .option('-s, --state-dir <dir>', 'Override state directory (defaults to <project>/.agent-team)')
  .action(async (text: string, opts: { project: string; stateDir?: string }) => {
    const projectDir = path.resolve(opts.project);
    const stateDir = opts.stateDir ? path.resolve(opts.stateDir) : undefined;
    console.log(chalk.gray(`Project: ${projectDir}`));
    validateEnv();
    const orchestrator = new Orchestrator(projectDir, stateDir);
    await orchestrator.handleRequest(text);
  });

program
  .command('run <taskId>')
  .description('Resume or re-run a specific task by ID')
  .option('-p, --project <dir>', 'Path to the project directory', process.cwd())
  .option('-s, --state-dir <dir>', 'Override state directory (defaults to <project>/.agent-team)')
  .action(async (taskId: string, opts: { project: string; stateDir?: string }) => {
    const projectDir = path.resolve(opts.project);
    const stateDir = opts.stateDir ? path.resolve(opts.stateDir) : undefined;
    validateEnv();
    const orchestrator = new Orchestrator(projectDir, stateDir);
    await orchestrator.executeTask(taskId);
  });

program
  .command('status')
  .description('Show status of all tasks for a project')
  .option('-p, --project <dir>', 'Path to the project directory', process.cwd())
  .option('-s, --state-dir <dir>', 'Override state directory (defaults to <project>/.agent-team)')
  .action((opts: { project: string; stateDir?: string }) => {
    const projectDir = path.resolve(opts.project);
    const stateDir = opts.stateDir ? path.resolve(opts.stateDir) : undefined;
    const orchestrator = new Orchestrator(projectDir, stateDir);
    orchestrator.showStatus();
  });

function validateEnv(): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(chalk.red('Error: ANTHROPIC_API_KEY environment variable is not set.'));
    process.exit(1);
  }
}

program.parse();
