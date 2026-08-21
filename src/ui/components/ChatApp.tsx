import React, { useCallback, useEffect, useState } from "react";
import { Box, useApp } from "ink";
import { AgentHeader } from "./AgentHeader.js";
import { ChatInput } from "./ChatInput.js";
import { Message } from "./Message.js";
import type { ChatMessage, SubmitPrompt, ToolActivity } from "../types.js";
import { Spinner } from "./Spinner.js";

interface ChatAppProps {
  workspace: string;
  model: string;
  onSubmit: SubmitPrompt;
}

export function ChatApp({
  workspace,
  model,
  onSubmit,
}: ChatAppProps): React.ReactElement {
  const { exit } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toolActivity, setToolActivity] = useState<ToolActivity[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(
    async (prompt: string) => {
      if (busy) return;
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "user", content: prompt },
      ]);

      if (prompt === "/exit" || prompt === "/quit") {
        exit();
        return;
      }
      if (prompt === "/clear") {
        setMessages([]);
        return;
      }

      const assistantId = crypto.randomUUID();
      
      setMessages((current) => [
        ...current,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setBusy(true);
      setToolActivity([]);
      let streamedContent = "";
      try {
        const response = await onSubmit(
          prompt,
          (activity) =>
            setToolActivity((current) => [
              ...current.filter((item) => item.name !== activity.name),
              activity,
            ]),
          (text) => {
            streamedContent += text;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, content: streamedContent }
                  : message,
              ),
            );
          },
        );
        const finalContent = response ?? streamedContent;
        if (finalContent) {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, content: finalContent }
                : message,
            ),
          );
        } else {
          setMessages((current) =>
            current.filter((message) => message.id !== assistantId),
          );
        }
      } catch (error) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  role: "system" as const,
                  content:
                    error instanceof Error ? error.message : String(error),
                }
              : message,
          ),
        );
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
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {busy && <Spinner busy={busy} toolActivity={toolActivity} />}
        <ChatInput disabled={busy} onSubmit={submit} />
      </Box>
    </>
  );
}
