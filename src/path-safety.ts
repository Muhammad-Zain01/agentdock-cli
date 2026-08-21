import path from "node:path";

export function resolveWorkspacePath(workspaceRoot: string, input: string): string {
  const resolved = path.resolve(workspaceRoot, input);
  const relative = path.relative(workspaceRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path is outside the workspace: ${input}`);
  }
  return resolved;
}
