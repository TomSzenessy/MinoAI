import type { ChannelProviderAdapter, InboundChannelMessage } from "../types";

type TelegramWebhookPayload = {
  message?: {
    text?: string;
    from?: {
      id?: number;
      username?: string;
    };
    chat?: {
      id?: number;
      type?: string;
    };
  };
};

function normalizeToken(raw: string): string {
  return raw.trim();
}

function extractMessage(payload: unknown): InboundChannelMessage | null {
  const data = payload as TelegramWebhookPayload;
  const text = data?.message?.text?.trim();
  if (!text) {
    return null;
  }

  const fromId = data.message?.from?.id;
  const username = data.message?.from?.username;
  const chatId = data.message?.chat?.id;

  return {
    text,
    senderId:
      typeof fromId === "number"
        ? fromId.toString()
        : typeof username === "string" && username.length > 0
          ? username
          : undefined,
    metadata: {
      chatId,
      chatType: data.message?.chat?.type,
    },
  };
}

export const telegramProviderAdapter: ChannelProviderAdapter = {
  provider: "telegram",
  label: "Telegram",
  requiredCredentials: [],
  optionalCredentials: ["botToken"],
  extractMessage,
  sanitizeCredentials(credentials) {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (typeof value !== "string") {
        continue;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        continue;
      }
      normalized[key] = key === "botToken" ? normalizeToken(trimmed) : trimmed;
    }
    return normalized;
  },
  validateCredentials(credentials) {
    const issues: string[] = [];
    const token = credentials.botToken;
    if (!token) {
      return issues;
    }

    if (token.length < 8 || /\s/.test(token)) {
      issues.push("telegram botToken format looks invalid");
    }
    return issues;
  },
};
