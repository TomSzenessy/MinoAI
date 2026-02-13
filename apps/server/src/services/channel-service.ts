import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AgentService } from "./agent-service";
import {
  listChannelProviders,
  resolveChannelProviderAdapter,
} from "../channels/registry";
import type { ChannelProvider } from "../channels/types";

export type { ChannelProvider } from "../channels/types";

export interface ChannelConfig {
  id: string;
  type: ChannelProvider;
  name: string;
  accountId?: string;
  enabled: boolean;
  webhookSecret: string;
  credentials: Record<string, string>;
  settings: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertChannelInput {
  id?: string;
  type: ChannelProvider;
  name: string;
  accountId?: string;
  enabled?: boolean;
  webhookSecret?: string;
  credentials?: Record<string, string>;
  settings?: Record<string, string | number | boolean>;
}

export interface ChannelWebhookResult {
  handled: boolean;
  status: "ok" | "ignored" | "unauthorized";
  provider: ChannelProvider;
  channelId?: string;
  reply?: string;
  reason?: string;
}

const CHANNELS_FILE = "channels.json";

function normalizeProvider(value: string): ChannelProvider | null {
  const adapter = resolveChannelProviderAdapter(value);
  return adapter?.provider ?? null;
}

function toSettingsRecord(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter((entry) => {
      const field = entry[1];
      return (
        typeof field === "string" ||
        typeof field === "number" ||
        typeof field === "boolean"
      );
    }),
  ) as Record<string, string | number | boolean>;
}

function toCredentialRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function toArray(value: unknown): ChannelConfig[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => entry && typeof entry === "object")
    .map((entry): ChannelConfig | null => {
      const channel = entry as Partial<ChannelConfig>;
      const provider = normalizeProvider(String(channel.type ?? ""));
      if (!provider) {
        return null;
      }

      const accountId =
        typeof channel.accountId === "string" && channel.accountId.trim().length > 0
          ? channel.accountId.trim()
          : undefined;

      return {
        id: typeof channel.id === "string" ? channel.id : "",
        type: provider,
        name: typeof channel.name === "string" ? channel.name : "Channel",
        ...(accountId ? { accountId } : {}),
        enabled: Boolean(channel.enabled),
        webhookSecret: typeof channel.webhookSecret === "string" ? channel.webhookSecret : "",
        credentials: toCredentialRecord(channel.credentials),
        settings: toSettingsRecord(channel.settings),
        createdAt:
          typeof channel.createdAt === "string"
            ? channel.createdAt
            : new Date().toISOString(),
        updatedAt:
          typeof channel.updatedAt === "string"
            ? channel.updatedAt
            : new Date().toISOString(),
      } satisfies ChannelConfig;
    })
    .filter((channel): channel is ChannelConfig => Boolean(channel && channel.id));
}

function createChannelId(provider: ChannelProvider): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `ch_${provider}_${Date.now().toString(36)}_${random}`;
}

export class ChannelService {
  private readonly channelsPath: string;

  constructor(dataDir: string) {
    this.channelsPath = join(dataDir, CHANNELS_FILE);
  }

  listChannels(): ChannelConfig[] {
    if (!existsSync(this.channelsPath)) {
      return [];
    }

    try {
      const raw = readFileSync(this.channelsPath, "utf-8");
      return toArray(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  upsertChannel(input: UpsertChannelInput): ChannelConfig {
    const channels = this.listChannels();
    const now = new Date().toISOString();
    const existing = input.id ? channels.find((channel) => channel.id === input.id) : undefined;
    const adapter = resolveChannelProviderAdapter(input.type);
    const sanitizedCredentials = adapter
      ? adapter.sanitizeCredentials(input.credentials ?? {})
      : (input.credentials ?? {});

    const next: ChannelConfig = {
      id: existing?.id ?? createChannelId(input.type),
      type: input.type,
      name: input.name.trim() || existing?.name || `${input.type} channel`,
      accountId: input.accountId?.trim() || existing?.accountId,
      enabled: input.enabled ?? existing?.enabled ?? true,
      webhookSecret: input.webhookSecret ?? existing?.webhookSecret ?? "",
      credentials: {
        ...(existing?.credentials ?? {}),
        ...sanitizedCredentials,
      },
      settings: {
        ...(existing?.settings ?? {}),
        ...toSettingsRecord(input.settings),
      },
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const updated = existing
      ? channels.map((channel) => (channel.id === next.id ? next : channel))
      : [...channels, next];
    this.writeChannels(updated);
    return next;
  }

  toggleChannel(id: string, enabled: boolean): ChannelConfig | null {
    const channels = this.listChannels();
    const existing = channels.find((channel) => channel.id === id);
    if (!existing) {
      return null;
    }

    const next: ChannelConfig = {
      ...existing,
      enabled,
      updatedAt: new Date().toISOString(),
    };

    this.writeChannels(channels.map((channel) => (channel.id === id ? next : channel)));
    return next;
  }

  deleteChannel(id: string): boolean {
    const channels = this.listChannels();
    const next = channels.filter((channel) => channel.id !== id);
    if (next.length === channels.length) {
      return false;
    }
    this.writeChannels(next);
    return true;
  }

  async handleWebhook(
    provider: ChannelProvider,
    payload: unknown,
    suppliedSecret: string | undefined,
    agent: AgentService,
  ): Promise<ChannelWebhookResult> {
    const adapter = resolveChannelProviderAdapter(provider);
    if (!adapter) {
      return {
        handled: false,
        status: "ignored",
        provider,
        reason: "unsupported_provider",
      };
    }

    const channels = this.listChannels();
    const channel = channels.find(
      (entry) =>
        entry.type === provider &&
        entry.enabled &&
        (entry.webhookSecret.length === 0 || entry.webhookSecret === (suppliedSecret ?? "")),
    );

    if (!channel) {
      const hasProviderChannel = channels.some(
        (entry) => entry.type === provider && entry.enabled,
      );

      return {
        handled: false,
        status: hasProviderChannel ? "unauthorized" : "ignored",
        provider,
        reason: hasProviderChannel ? "invalid_webhook_secret" : "no_enabled_channel",
      };
    }

    const inbound = adapter.extractMessage(payload);
    if (!inbound?.text) {
      return {
        handled: false,
        status: "ignored",
        provider,
        channelId: channel.id,
        reason: "no_message_text",
      };
    }

    const result = await agent.chat({
      message: inbound.text,
      channel: provider,
    });

    return {
      handled: true,
      status: "ok",
      provider,
      channelId: channel.id,
      reply: result.reply,
    };
  }

  listProviderCapabilities() {
    return listChannelProviders();
  }

  private writeChannels(channels: ChannelConfig[]): void {
    writeFileSync(this.channelsPath, JSON.stringify(channels, null, 2));
  }
}
