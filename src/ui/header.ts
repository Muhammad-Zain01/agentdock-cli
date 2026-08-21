import { intro, note } from "@clack/prompts";
import { uiTheme } from "./theme.js";
import type { UiContext } from "./types.js";

export function renderHeader(context: UiContext): void {
  intro(uiTheme.brand);
  note(
    [
      `workspace  ${context.workspace}`,
      `session    ${context.session}`,
      `model      ${context.model}`,
      `writes     ${context.allowWrites ? "enabled" : "disabled"}`,
    ].join("\n"),
    "Environment",
  );
}
