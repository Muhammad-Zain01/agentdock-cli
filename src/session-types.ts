import type {
  Message,
  ToolCallRecord,
  ToolErrorRecord,
  ToolResultRecord,
} from "agentdock";

export interface CliRun {
  id: string;
  prompt: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "completed" | "failed" | "aborted";
  content?: string;
  toolCalls: ToolCallRecord[];
  toolResults: ToolResultRecord[];
  toolErrors: ToolErrorRecord[];
  error?: string;
}

export interface CliSession {
  version: 1;
  id: string;
  workspaceRoot: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  runs: CliRun[];
}
