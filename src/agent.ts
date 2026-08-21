import {
  streamAgent,
  type AgentContext,
  type AgentHooks,
  type RunAgentOptions,
} from "agentdock";
import { createToolRegistryFor } from "./tools.js";
import type { AppLogger } from "./logging/logger.js";
import type { CliSession } from "./session-types.js";

export async function executePrompt(
  session: CliSession,
  prompt: string,
  options: {
    allowWrites: boolean;
    modelId?: string;
    logger: AppLogger;
    onToolCall?: (tool: { name: string; input: unknown }) => void;
    onToolResult?: (tool: { name: string; error?: string }) => void;
    onText?: (text: string) => void;
  },
) {
  const logger = options.logger.child({ module: "agent" });
  const hooks: AgentHooks = {
    onToolCall: (tool) => {
      logger.debug({ toolName: tool.name }, "tool started");
      options.onToolCall?.({ name: tool.name, input: tool.input });
    },
    onToolResult: (result) => {
      logger.debug({ toolName: result.name, error: result.error }, "tool completed");
      options.onToolResult?.({ name: result.name, error: result.error });
    },
  };
  const context: AgentContext = {
    userId: "cli-user",
    organizationId: "cli-organization",
  };
  const agentOptions: RunAgentOptions = {
    messages: session.messages,
    registry: createToolRegistryFor({ workspaceRoot: session.workspaceRoot, allowWrites: options.allowWrites }),
    hooks,
    modelId: options.modelId,
  };
  const promptStartedAt = Date.now();
  let chunkCount = 0;
  let textLength = 0;
  logger.info({ promptLength: prompt.length, modelId: options.modelId }, "agent prompt started");

  try {
    const stream = await streamAgent(prompt, context, agentOptions);
    for await (const text of stream.textStream) {
      chunkCount += 1;
      textLength += text.length;
      options.onText?.(text);
    }
    const result = await stream.result;
    logger.info(
      {
        durationMs: Date.now() - promptStartedAt,
        chunkCount,
        textLength,
        toolCallCount: result.toolCalls.length,
      },
      "agent prompt completed",
    );
    return { result };
  } catch (error) {
    logger.error({ err: error, durationMs: Date.now() - promptStartedAt }, "agent prompt failed");
    throw error;
  }
}
