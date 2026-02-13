import type { ChannelProviderAdapter, InboundChannelMessage } from "../types";

type WhatsAppWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{
          wa_id?: string;
          profile?: {
            name?: string;
          };
        }>;
        messages?: Array<{
          from?: string;
          text?: {
            body?: string;
          };
          type?: string;
        }>;
      };
    }>;
  }>;
};

function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9+]/g, "");
}

function extractMessage(payload: unknown): InboundChannelMessage | null {
  const data = payload as WhatsAppWebhookPayload;
  const change = data.entry?.[0]?.changes?.[0]?.value;
  const message = change?.messages?.[0];
  const text = message?.text?.body?.trim();
  if (!text) {
    return null;
  }

  const senderId = message?.from ?? change?.contacts?.[0]?.wa_id;
  const senderName = change?.contacts?.[0]?.profile?.name;

  return {
    text,
    senderId,
    metadata: {
      senderName,
      messageType: message?.type,
    },
  };
}

export const whatsappProviderAdapter: ChannelProviderAdapter = {
  provider: "whatsapp",
  label: "WhatsApp",
  requiredCredentials: [],
  optionalCredentials: ["accessToken", "phoneNumberId"],
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
      if (key === "phoneNumberId") {
        normalized[key] = normalizePhone(trimmed);
      } else {
        normalized[key] = trimmed;
      }
    }
    return normalized;
  },
  validateCredentials(credentials) {
    const issues: string[] = [];

    if (credentials.phoneNumberId && !/^\+?\d{5,20}$/.test(credentials.phoneNumberId)) {
      issues.push("whatsapp phoneNumberId format looks invalid");
    }

    if (credentials.accessToken && credentials.accessToken.length < 8) {
      issues.push("whatsapp accessToken format looks invalid");
    }

    return issues;
  },
};
