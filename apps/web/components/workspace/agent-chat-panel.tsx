"use client";

import { FormEvent, useMemo, useState } from "react";
import { sendAgentChat } from "@/lib/api";
import { useTranslation } from "@/components/i18n-provider";
import type { LinkedServerProfile } from "@/lib/storage";

interface AgentChatPanelProps {
  profile: LinkedServerProfile | null;
  selectedNotePath?: string;
  open: boolean;
  onToggle: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

export function AgentChatPanel({
  profile,
  selectedNotePath,
  open,
  onToggle,
}: AgentChatPanelProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const suggestedPrompts = useMemo(
    () => [
      t("workspace.agent.promptFindConnections"),
      t("workspace.agent.promptSummarize"),
      t("workspace.agent.promptCreateChecklist"),
    ],
    [t],
  );

  const submit = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || !profile || busy) return;

    setMessages((prev) => [...prev, createMessage("user", trimmed)]);
    setInput("");
    setBusy(true);

    try {
      const response = await sendAgentChat(profile.serverUrl, profile.apiKey, {
        message: trimmed,
        notePath: selectedNotePath,
        channel: "web",
      });

      setMessages((prev) => [...prev, createMessage("assistant", response.reply)]);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : t("workspace.agent.error");
      setMessages((prev) => [...prev, createMessage("assistant", messageText)]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit(input);
  };

  if (!open) {
    return (
      <div className="flex w-12 items-center justify-center border-l border-white/5 bg-mino-surface/30 backdrop-blur-lg">
        <button
          onClick={onToggle}
          className="rounded-full border border-white/10 bg-white/5 px-2 py-3 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] transition-colors hover:border-[var(--purple-400)] hover:text-white"
          title={t("workspace.statusBar.openAgent")}
        >
          AI
        </button>
      </div>
    );
  }

  return (
    <aside className="flex w-80 flex-col border-l border-white/5 bg-mino-surface/40 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{t("workspace.agent.title")}</h2>
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {profile?.name ?? t("workspace.statusBar.defaultServerName")}
          </p>
        </div>
        <button
          className="button-secondary px-2 py-1 text-xs"
          onClick={onToggle}
        >
          {t("workspace.agent.close")}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              {t("workspace.agent.empty")}
            </p>
            <div className="space-y-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--purple-400)] hover:text-white"
                  onClick={() => void submit(prompt)}
                  disabled={busy}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                message.role === "user"
                  ? "ml-6 bg-[var(--purple-600)]/30 text-white"
                  : "mr-6 border border-white/10 bg-white/5 text-[var(--text-secondary)]"
              }`}
            >
              {message.content}
            </div>
          ))
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-white/5 p-3">
        <textarea
          className="field min-h-[88px] resize-none text-sm"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("workspace.agent.placeholder")}
          disabled={busy || !profile}
        />
        <div className="mt-2 flex justify-end">
          <button
            className="button-primary text-xs"
            type="submit"
            disabled={busy || !input.trim() || !profile}
          >
            {busy ? t("workspace.agent.sending") : t("workspace.agent.send")}
          </button>
        </div>
      </form>
    </aside>
  );
}
