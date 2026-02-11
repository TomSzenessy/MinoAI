import { ApiRequestError } from "./api";
import { getWebConfig } from "./config";

export interface RelayExchangePayload {
  serverId: string;
  serverUrl: string;
  apiKey: string;
  connected: boolean;
}

function normalizeRelayUrl(input?: string): string {
  const fallback = getWebConfig().relayUrl;
  const candidate = (input ?? fallback).trim();
  return candidate.replace(/\/+$/, "");
}

export async function exchangeRelayCode(
  relayCode: string,
  relayUrlOverride?: string,
): Promise<RelayExchangePayload> {
  const relayUrl = normalizeRelayUrl(relayUrlOverride);
  const response = await fetch(`${relayUrl}/api/v1/pair/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: relayCode }),
  });

  const body = await response.json().catch(() => null) as
    | { success: true; data: RelayExchangePayload }
    | { success: false; error: { code?: string; message?: string } }
    | null;

  if (!response.ok || !body || body.success !== true) {
    const code = body && "error" in body ? body.error?.code ?? "PAIR_EXCHANGE_FAILED" : "PAIR_EXCHANGE_FAILED";
    const message =
      body && "error" in body
        ? body.error?.message ?? "Failed to exchange relay pairing code."
        : "Failed to exchange relay pairing code.";
    throw new ApiRequestError(response.status || 500, code, message);
  }

  return body.data;
}
