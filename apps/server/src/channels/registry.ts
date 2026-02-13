import { telegramProviderAdapter } from "./providers/telegram";
import { whatsappProviderAdapter } from "./providers/whatsapp";
import type {
  ChannelProvider,
  ChannelProviderAdapter,
  ChannelProviderCapabilities,
} from "./types";

const adapters: Record<ChannelProvider, ChannelProviderAdapter> = {
  telegram: telegramProviderAdapter,
  whatsapp: whatsappProviderAdapter,
};

export function listChannelProviders(): ChannelProviderCapabilities[] {
  return Object.values(adapters).map((adapter) => ({
    provider: adapter.provider,
    label: adapter.label,
    requiredCredentials: [...adapter.requiredCredentials],
    optionalCredentials: [...adapter.optionalCredentials],
  }));
}

export function resolveChannelProviderAdapter(
  provider: string,
): ChannelProviderAdapter | null {
  const normalized = provider.trim().toLowerCase();
  if (normalized !== "telegram" && normalized !== "whatsapp") {
    return null;
  }
  return adapters[normalized] ?? null;
}
