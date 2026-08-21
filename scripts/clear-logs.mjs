import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const logsDirectory = path.resolve(process.cwd(), "logs");
const logPath = path.join(logsDirectory, "agentdock-cli.log");

await mkdir(logsDirectory, { recursive: true });
await writeFile(logPath, "", "utf8");

console.log(`Cleared ${logPath}`);
