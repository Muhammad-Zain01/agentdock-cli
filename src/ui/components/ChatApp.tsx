import React, { useCallback, useEffect, useState } from "react";
import { Box, Text, useApp } from "ink";
import { AgentHeader } from "./AgentHeader.js";
import { ChatInput } from "./ChatInput.js";
import { Message } from "./Message.js";
import { ToolStatus } from "./ToolStatus.js";
import { palette } from "../theme.js";
import type { ChatMessage, SubmitPrompt, ToolActivity } from "../types.js";

interface ChatAppProps {
  workspace: string;
  model: string;
  onSubmit: SubmitPrompt;
}

const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function ChatApp({ workspace, model, onSubmit }: ChatAppProps): React.ReactElement {
  const { exit } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toolActivity, setToolActivity] = useState<ToolActivity[]>([]);
  const [busy, setBusy] = useState(false);
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!busy) {
      setSpinnerIndex(0);
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const timer = setInterval(() => {
      setSpinnerIndex((current) => (current + 1) % spinnerFrames.length);
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 120);

    return () => clearInterval(timer);
  }, [busy]);

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
      <AgentHeader workspace={workspace} model={model} />

      <Box flexDirection="column">
        {messages.map((message) => <Message key={message.id} message={message} />)}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {busy && (
          <Box marginBottom={1} paddingX={1}>
            <Text color={palette.working} bold>
              {spinnerFrames[spinnerIndex]} Working ({elapsedSeconds}s)
            </Text>
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
