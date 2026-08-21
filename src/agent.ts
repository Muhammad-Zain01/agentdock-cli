import {
  streamAgent,
  type AgentContext,
  type AgentHooks,
  type RunAgentOptions,
} from "agentdock";
import { createToolRegistryFor } from "./tools.js";
import type { CliSession } from "./session-types.js";

export async function executePrompt(
  session: CliSession,
  prompt: string,
  options: {
    allowWrites: boolean;
    modelId?: string;
    onToolCall?: (tool: { name: string; input: unknown }) => void;
    onToolResult?: (tool: { name: string; error?: string }) => void;
    onText?: (text: string) => void;
  },
) {
  const hooks: AgentHooks = {
    onToolCall: (tool) => {
      options.onToolCall?.({ name: tool.name, input: tool.input });
    },
    onToolResult: (result) => {
      options.onToolResult?.({ name: result.name, error: result.error });
    },
  };
  const context: AgentContext = {
    userId: "cli-user",
    organizationId: "cli-organization",
    permissions: ["*"],
    role: "ADMIN",
  };
  const agentOptions: RunAgentOptions = {
    messages: session.messages,
    registry: createToolRegistryFor({ workspaceRoot: session.workspaceRoot, allowWrites: options.allowWrites }),
    hooks,
    modelId: options.modelId,
  };
  const stream = await streamAgent(prompt, context, agentOptions);
  for await (const text of stream.textStream) options.onText?.(text);
  return { result: await stream.result };
}
