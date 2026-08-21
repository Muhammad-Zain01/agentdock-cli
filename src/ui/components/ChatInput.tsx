import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { palette } from "../theme.js";

interface ChatInputProps {
  disabled: boolean;
  onSubmit: (value: string) => void;
}

export function ChatInput({ disabled, onSubmit }: ChatInputProps): React.ReactElement {
  const [value, setValue] = useState("");

  useInput((input, key) => {
    if (disabled) return;
    if (key.return) {
      if (key.shift) {
        setValue((current) => `${current}\n`);
        return;
      }
      const prompt = value.trim();
      if (!prompt) return;
      setValue("");
      onSubmit(prompt);
      return;
    }
    if (key.backspace || key.delete) {
      setValue((current) => current.slice(0, -1));
      return;
    }
    if (!key.ctrl && !key.meta && input) {
      setValue((current) => current + input);
    }
  });

  return (
    <Box width="100%" minHeight={3} paddingX={2} paddingY={1} backgroundColor={palette.surface}>
      <Text color={palette.text}>› </Text>
      <Text color={value ? palette.text : palette.muted}>{value || "Ask to do anything"}</Text>
      {value && <Text backgroundColor="magenta" color="black"> </Text>}
    </Box>
  );
}
