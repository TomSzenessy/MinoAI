export type ChannelProvider = "telegram" | "whatsapp";

export interface InboundChannelMessage {
  text: string;
  senderId?: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelProviderCapabilities {
  provider: ChannelProvider;
  label: string;
  requiredCredentials: string[];
  optionalCredentials: string[];
}

export interface ChannelProviderAdapter {
  provider: ChannelProvider;
  label: string;
  requiredCredentials: string[];
  optionalCredentials: string[];
  extractMessage(payload: unknown): InboundChannelMessage | null;
  sanitizeCredentials(credentials: Record<string, string>): Record<string, string>;
  validateCredentials(credentials: Record<string, string>): string[];
}
