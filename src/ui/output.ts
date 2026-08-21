import { log } from "@clack/prompts";
import { uiTheme } from "./theme.js";

export function renderUserPrompt(prompt: string): void {
  log.info(`${uiTheme.prompt}  ${prompt}`);
}

export function renderAssistantOutput(content: string): void {
  log.success(`${uiTheme.assistant}\n${content}`);
}
