export type ToolState = "running" | "complete" | "error";

export interface ToolActivity {
  name: string;
  state: ToolState;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export type ToolUpdate = (activity: ToolActivity) => void;

export type SubmitPrompt = (
  prompt: string,
  onToolUpdate: ToolUpdate,
) => Promise<string | null>;
