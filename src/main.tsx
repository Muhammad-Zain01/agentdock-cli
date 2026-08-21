import { loadEnvFile } from "node:process";
import path from "node:path";
import { render } from "ink";
import React from "react";
import { executePrompt } from "./agent.js";
import { createLogger } from "./logging/logger.js";
import { SessionStore } from "./session-store.js";
import { ChatApp } from "./ui/components/ChatApp.js";
import type { TextUpdate, ToolUpdate } from "./ui/types.js";

try {
  loadEnvFile();
} catch {
  // Shell environment variables remain supported when .env is absent.
}

const workspace = path.resolve(process.cwd(), "../agentdock");
const store = new SessionStore(path.resolve(process.cwd(), "sessions"));
const logger = createLogger().child({ module: "main" });

async function runCli(): Promise<void> {
  logger.info({ workspace }, "agentdock-cli starting");
  let session = await store.create(workspace);
  await store.save(session);
  logger.info({ sessionId: session.id }, "session created");

  const onSubmit = async (prompt: string, onToolUpdate: ToolUpdate, onText: TextUpdate): Promise<string | null> => {
    logger.debug({ command: prompt.startsWith("/") ? prompt : undefined, promptLength: prompt.length }, "input received");
    if (prompt === "/help") return "/help  /inspect  /new  /tools  /clear  /exit";
    if (prompt === "/tools") return "read_file, list_files, search_files, write_file, update_file";
    if (prompt === "/inspect") return JSON.stringify(session, null, 2);
    if (prompt === "/new") {
      session = await store.create(workspace);
      await store.save(session);
      logger.info({ sessionId: session.id }, "session created from command");
      return `Started session ${session.id}`;
    }

    const { result } = await executePrompt(session, prompt, {
      allowWrites: false,
      onToolCall: (tool) => onToolUpdate({ name: tool.name, state: "running" }),
      onToolResult: (tool) => onToolUpdate({ name: tool.name, state: tool.error ? "error" : "complete" }),
      onText,
      logger,
    });
    session.messages = result.messages;
    await store.save(session);
    return result.content;
  };

  const instance = render(
    <ChatApp
      workspace={workspace}
      model="openrouter/default"
      onSubmit={onSubmit}
    />,
  );

  await instance.waitUntilExit();
  await store.save(session);
  logger.info({ sessionId: session.id }, "agentdock-cli stopped");
}

runCli().catch((error: unknown) => {
  logger.error({ err: error }, "agentdock-cli failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
