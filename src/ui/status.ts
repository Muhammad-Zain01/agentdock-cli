import { log } from "@clack/prompts";
import { uiTheme } from "./theme.js";

export function renderReadyState(): void {
  log.step(`${uiTheme.brand} is ready`);
}

export function renderToolState(name: string, state: "running" | "complete" | "error"): void {
  const label = state === "running" ? "running" : state === "complete" ? "done" : "error";
  log.message(`${uiTheme.tool}  ${name}  ${label}`);
}
