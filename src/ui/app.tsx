import React, { useCallback, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { palette } from "./theme.js";
import type { ChatMessage, SubmitPrompt, ToolActivity } from "./types.js";

interface ChatAppProps {
  workspace: string;
  model: string;
  onSubmit: SubmitPrompt;
}

interface ChatInputProps {
  disabled: boolean;
  onSubmit: (value: string) => void;
}

function ChatInput({ disabled, onSubmit }: ChatInputProps): React.ReactElement {
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
      <Text color={value ? palette.text : palette.muted}>{value || "Ask AgentDock to do anything"}</Text>
      {value && <Text backgroundColor="magenta" color="black"> </Text>}
    </Box>
  );
}

function Message({ message }: { message: ChatMessage }): React.ReactElement {
  if (message.role === "user") {
    return (
      <Box width="100%" marginTop={1} paddingX={2} paddingY={1} backgroundColor={palette.surface}>
        <Text color={palette.text}>› </Text>
        <Text color={palette.text}>{message.content}</Text>
      </Box>
    );
  }

  const color = message.role === "assistant" ? palette.text : palette.error;

  return (
    <Box marginTop={1} paddingX={2}>
      <Text color={color} bold>• </Text>
      <Text color={color}>&nbsp;{message.content}</Text>
    </Box>
  );
}

function ToolStatus({ activity }: { activity: ToolActivity }): React.ReactElement {
  const color = activity.state === "error" ? palette.error : activity.state === "complete" ? palette.success : palette.working;
  const label = activity.state === "running" ? "working" : activity.state === "complete" ? "done" : "error";

  return (
    <Text color={color}>
      • {activity.name} ({label})
    </Text>
  );
}

function compactPath(value: string): string {
  const parts = value.split("/");
  return parts.length > 2 ? `…/${parts.slice(-2).join("/")}` : value;
}

export function ChatApp({ workspace, model, onSubmit }: ChatAppProps): React.ReactElement {
  const { exit } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toolActivity, setToolActivity] = useState<ToolActivity[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(
    async (prompt: string) => {
      if (busy) return;
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: prompt }]);

      if (prompt === "/exit" || prompt === "/quit") {
        exit();
        return;
      }
      if (prompt === "/clear") {
        setMessages([]);
        return;
      }

      setBusy(true);
      setToolActivity([]);
      try {
        const response = await onSubmit(
          prompt,
          (activity) => setToolActivity((current) => [...current.filter((item) => item.name !== activity.name), activity]),
        );
        if (response) {
          setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: response }]);
        }
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "system",
            content: error instanceof Error ? error.message : String(error),
          },
        ]);
      } finally {
        setBusy(false);
        setToolActivity([]);
      }
    },
    [busy, exit, onSubmit],
  );

  return (
    <>
      <Box flexDirection="column" marginX={1} marginBottom={1} paddingX={2} paddingY={1} borderStyle="round" borderColor={palette.muted}>
        <Box>
          <Text color={palette.muted}>›_ </Text>
          <Text bold color={palette.text}>AgentDock</Text>
          <Text color={palette.muted}> (v0.1.0)</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={palette.muted}>model: </Text>
          <Text color={palette.text}>{model}</Text>
        </Box>
        <Box>
          <Text color={palette.muted}>directory: </Text>
          <Text color={palette.text}>{compactPath(workspace)}</Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        {messages.map((message) => <Message key={message.id} message={message} />)}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {busy && (
          <Box marginBottom={1} paddingX={3}>
            <Text color={palette.working} bold>• Working</Text>
            {toolActivity.length > 0 && (
              <Text color={palette.muted}>  <ToolStatus activity={toolActivity[toolActivity.length - 1]} /></Text>
            )}
          </Box>
        )}
        <ChatInput disabled={busy} onSubmit={submit} />
      </Box>
    </>
  );
}
