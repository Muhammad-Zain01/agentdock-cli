import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { executePrompt } from "./agent.js";
import { SessionStore } from "./session-store.js";
import type { CliRun, CliSession } from "./session-types.js";

interface ReplOptions {
  store: SessionStore;
  session: CliSession;
  allowWrites: boolean;
  modelId?: string;
}

function printHeader(session: CliSession): void {
  console.log("\nAgentDock CLI");
  console.log(`Session: ${session.id}`);
  console.log(`Workspace: ${session.workspaceRoot}`);
  console.log('Type /help for commands. Type /exit to quit.\n');
}

function printHelp(): void {
  console.log(`
Commands:
  /help                 Show this help
  /sessions             List saved sessions
  /resume <id>          Switch to another session
  /new                  Create and switch to a new session
  /inspect              Show the current session JSON
  /tools                Show available tools
  /clear                Clear the terminal
  /exit                 Save and exit
`);
}

async function createSession(options: ReplOptions): Promise<CliSession> {
  const session = await options.store.create(options.session.workspaceRoot);
  await options.store.save(session);
  return session;
}

async function handleCommand(line: string, options: ReplOptions): Promise<"continue" | "exit"> {
  const [command, ...args] = line.slice(1).trim().split(/\s+/);
  switch (command) {
    case "help":
      printHelp();
      return "continue";
    case "exit":
    case "quit":
      return "exit";
    case "clear":
      console.clear();
      return "continue";
    case "inspect":
      console.log(JSON.stringify(options.session, null, 2));
      return "continue";
    case "tools":
      console.log("read_file, list_files, search_files, write_file, update_file");
      return "continue";
    case "sessions": {
      const sessions = await options.store.list();
      if (sessions.length === 0) console.log("No sessions found.");
      for (const session of sessions) {
        console.log(`${session.id}  ${session.updatedAt}  ${session.workspaceRoot}`);
      }
      return "continue";
    }
    case "new":
      options.session = await createSession(options);
      printHeader(options.session);
      return "continue";
    case "resume": {
      if (!args[0]) {
        console.log("Usage: /resume <session-id>");
        return "continue";
      }
      options.session = await options.store.load(args[0]);
      printHeader(options.session);
      return "continue";
    }
    default:
      console.log(`Unknown command: /${command}. Type /help.`);
      return "continue";
  }
}

async function runTurn(prompt: string, options: ReplOptions): Promise<void> {
  const run: CliRun = {
    id: crypto.randomUUID(),
    prompt,
    startedAt: new Date().toISOString(),
    status: "running" as const,
    toolCalls: [],
    toolResults: [],
    toolErrors: [],
  };
  options.session.runs.push(run);
  await options.store.save(options.session);
  process.stdout.write("\nAgent> ");
  try {
    const { result } = await executePrompt(options.session, prompt, {
      allowWrites: options.allowWrites,
      modelId: options.modelId,
      onToolCall: (tool) => console.error(`\n[tool] ${tool.name} ${JSON.stringify(tool.input)}`),
      onToolResult: (tool) => console.error(`[done] ${tool.name}${tool.error ? ` ERROR: ${tool.error}` : ""}`),
      onText: (text) => process.stdout.write(text),
    });
    process.stdout.write("\n\n");
    run.status = "completed";
    run.completedAt = new Date().toISOString();
    run.content = result.content;
    run.toolCalls = result.toolCalls;
    run.toolResults = result.toolResults;
    run.toolErrors = result.toolErrors;
    options.session.messages = result.messages;
    await options.store.save(options.session);
  } catch (error) {
    run.status = "failed";
    run.completedAt = new Date().toISOString();
    run.error = error instanceof Error ? error.message : String(error);
    await options.store.save(options.session);
    throw error;
  }
}

export async function startRepl(options: ReplOptions): Promise<void> {
  printHeader(options.session);
  const rl = createInterface({ input, output, terminal: true });
  try {
    while (true) {
      const line = (await rl.question("You> ")).trim();
      if (!line) continue;
      if (line.startsWith("/")) {
        if (await handleCommand(line, options) === "exit") break;
        continue;
      }
      try {
        await runTurn(line, options);
      } catch (error) {
        console.error(`\nError: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
  } finally {
    rl.close();
    await options.store.save(options.session);
  }
}
