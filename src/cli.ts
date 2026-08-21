#!/usr/bin/env node
import { loadEnvFile } from "node:process";
import path from "node:path";
import { Command } from "commander";
import { SessionStore } from "./session-store.js";
import { startRepl } from "./repl.js";

try {
  loadEnvFile();
} catch {
  // Shell environment variables remain supported when .env is absent.
}

const program = new Command();
program
  .name("agentdock-cli")
  .description("Interactive playground for the AgentDock harness")
  .version("0.1.0")
  .option("-w, --workspace <path>", "workspace root", "../agentdock")
  .option("-r, --resume <session-id>", "resume a saved session")
  .option("--latest", "resume the latest saved session")
  .option("--allow-writes", "enable write_file and update_file")
  .option("--model <model>", "OpenRouter model id");

program
  .command("sessions")
  .description("List saved sessions")
  .action(async () => {
    const store = new SessionStore(path.resolve(process.cwd(), "sessions"));
    for (const session of await store.list()) {
      console.log(`${session.id}  ${session.updatedAt}  ${session.workspaceRoot}`);
    }
  });

program
  .command("inspect <session-id>")
  .description("Print a saved session")
  .action(async (id: string) => {
    const store = new SessionStore(path.resolve(process.cwd(), "sessions"));
    console.log(JSON.stringify(await store.load(id), null, 2));
  });

program.action(async () => {
  const options = program.opts<{
    workspace: string;
    resume?: string;
    latest?: boolean;
    allowWrites?: boolean;
    model?: string;
  }>();
  const store = new SessionStore(path.resolve(process.cwd(), "sessions"));
  const workspace = path.resolve(process.cwd(), options.workspace);
  let session;
  if (options.resume) {
    session = await store.load(options.resume);
  } else if (options.latest) {
    const saved = await store.list();
    session = saved[0];
    if (!session) throw new Error("No saved sessions found");
  } else {
    session = await store.create(workspace);
    await store.save(session);
  }
  await startRepl({
    store,
    session,
    allowWrites: Boolean(options.allowWrites),
    modelId: options.model,
  });
});

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
