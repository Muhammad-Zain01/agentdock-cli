import { outro } from "@clack/prompts";
import { renderHeader } from "./header.js";
import { renderAssistantOutput, renderUserPrompt } from "./output.js";
import { renderReadyState, renderToolState } from "./status.js";

renderHeader({
  workspace: "../agentdock",
  session: "preview-session",
  model: "openrouter/default",
  allowWrites: false,
});
renderReadyState();
renderUserPrompt("Inspect the current workspace");
renderToolState("list_files", "running");
renderToolState("list_files", "complete");
renderAssistantOutput("The UI layer is ready for AgentDock integration.");
outro("UI preview complete");
