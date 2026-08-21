import React from "react";
import { Text } from "ink";
import { palette } from "../theme.js";
import type { ToolActivity } from "../types.js";

export function ToolStatus({ activity }: { activity: ToolActivity }): React.ReactElement {
  const color = activity.state === "error" ? palette.error : activity.state === "complete" ? palette.success : palette.working;
  const label = activity.state === "running" ? "working" : activity.state === "complete" ? "done" : "error";

  return (
    <Text color={color}>
      • {activity.name} ({label})
    </Text>
  );
}
