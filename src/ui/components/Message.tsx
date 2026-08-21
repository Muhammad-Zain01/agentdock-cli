import React from "react";
import { Box, Text } from "ink";
import { palette } from "../theme.js";
import type { ChatMessage } from "../types.js";

export function Message({
  message,
}: {
  message: ChatMessage;
}): React.ReactElement {
  if (message.role === "user") {
    return (
      <Box
        width="100%"
        marginTop={1}
        paddingX={2}
        paddingY={1}
        backgroundColor={palette.surface}
      >
        <Text color={palette.text}>› </Text>
        <Text color={palette.text}>{message.content}</Text>
      </Box>
    );
  }

  const color = message.role === "assistant" ? palette.text : palette.error;

  if (message.content == "") {
    return <></>;
  }
  return (
    <Box marginTop={1} paddingX={2}>
      <Text color={color} bold>
        •{" "}
      </Text>
      <Text color={color}>&nbsp;{message.content}</Text>
    </Box>
  );
}
