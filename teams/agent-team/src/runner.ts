import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import type { MessageParam, Tool } from '@anthropic-ai/sdk/resources/messages.js';
import type { ToolHandler } from './tools.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AGENT_COLORS: Record<string, any> = {
  cto: chalk.cyan,
  architect: chalk.magenta,
  code_reviewer: chalk.yellow,
  wiring_expert: chalk.blue,
  implementor_1: chalk.green,
  implementor_2: chalk.greenBright,
};

export class AgentRunner {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  /**
   * Run an agent through a message loop until it stops calling tools.
   * Returns the agent's final text response.
   */
  async run(opts: {
    agentId: string;
    model: string;
    systemPrompt: string;
    tools: Tool[];
    toolHandlers: Record<string, ToolHandler>;
    initialMessage: string;
    maxTurns?: number;
  }): Promise<string> {
    const { agentId, model, systemPrompt, tools, toolHandlers, initialMessage, maxTurns = 30 } = opts;
    const color = AGENT_COLORS[agentId] ?? chalk.white;

    console.log(color(`\n${'─'.repeat(60)}`));
    console.log(color(`▶ [${agentId.toUpperCase()}] Starting`));
    console.log(color(`${'─'.repeat(60)}`));

    const messages: MessageParam[] = [{ role: 'user', content: initialMessage }];
    let turn = 0;

    while (turn < maxTurns) {
      const response = await this.client.messages.create({
        model,
        max_tokens: 8096,
        system: systemPrompt,
        messages,
        tools: tools.length > 0 ? tools : undefined,
      });

      // Show any text the agent outputs
      for (const block of response.content) {
        if (block.type === 'text' && block.text.trim()) {
          console.log(color(`[${agentId}] ${block.text.trim()}`));
        }
      }

      // Agent is done — no more tool calls
      if (response.stop_reason !== 'tool_use') {
        const finalText = response.content
          .filter(b => b.type === 'text')
          .map(b => (b as { type: 'text'; text: string }).text)
          .join('\n')
          .trim();
        console.log(color(`✓ [${agentId.toUpperCase()}] Done\n`));
        return finalText;
      }

      // Process tool calls
      const toolResults: MessageParam['content'] = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        console.log(color(`  ⚙ [${agentId}] → ${block.name}(${JSON.stringify(block.input).slice(0, 120)})`));

        const handler = toolHandlers[block.name];
        if (!handler) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({ error: `Tool not available: ${block.name}` }),
            is_error: true,
          });
          continue;
        }

        try {
          const result = await handler(block.input as Record<string, unknown>);
          const resultStr = JSON.stringify(result);
          console.log(color(`    ↩ ${resultStr.slice(0, 200)}`));
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: resultStr,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.log(chalk.red(`    ✗ Tool error: ${msg}`));
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({ error: msg }),
            is_error: true,
          });
        }
      }

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
      turn++;
    }

    throw new Error(`[${agentId}] Exceeded max turns (${maxTurns})`);
  }
}
