/**
 * Relay Connector — Outbound long-poll tunnel from server -> relay.
 *
 * The connector lets relay proxy requests to private servers without open ports:
 *   1) Server registers itself at relay with serverId + relay secret.
 *   2) Server long-polls for queued proxied requests.
 *   3) Server executes each request locally and posts response back to relay.
 */

import { logger } from "../utils/logger";

interface RelayQueuedRequest {
  requestId: string;
  method: string;
  path: string;
  query: string;
  headers: Record<string, string>;
  bodyBase64?: string;
}

interface RelayQueuedResponse {
  status: number;
  headers: Record<string, string>;
  bodyBase64: string;
}

interface RelayPullResult {
  request: RelayQueuedRequest;
}

interface RelayConnectorOptions {
  relayUrl: string;
  serverId: string;
  relaySecret: string;
  getRelayPairCode: () => string;
  adminApiKey: string;
  localBaseUrl: string;
  waitMs?: number;
}

const SKIP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function toBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function toBodyBase64(buffer: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(buffer)).toString("base64");
}

function fromBase64(value?: string): Uint8Array | undefined {
  if (!value) {
    return undefined;
  }
  return new Uint8Array(Buffer.from(value, "base64"));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buildRelayRequestError(
  operation: string,
  response: Response,
  baseUrl: string,
): Promise<Error> {
  const endpointHint =
    response.status === 404 && baseUrl.startsWith("http://")
      ? " (hint: use https:// for public relays; http redirects can change POST to GET)"
      : "";

  let bodyHint = "";
  try {
    const text = (await response.text()).trim();
    if (text) {
      bodyHint = ` — ${text.slice(0, 160)}`;
    }
  } catch {
    // ignore body read failures
  }

  return new Error(`${operation} failed (${response.status})${endpointHint}${bodyHint}`);
}

function stripForwardedHeaders(headers: Record<string, string>): Headers {
  const next = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (SKIP_HEADERS.has(lower)) {
      continue;
    }
    next.set(key, value);
  }
  next.set("x-mino-relay", "1");
  return next;
}

async function registerServer(baseUrl: string, options: RelayConnectorOptions): Promise<void> {
  const response = await fetch(`${baseUrl}/api/v1/relay/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serverId: options.serverId,
      relaySecret: options.relaySecret,
      relayPairCode: options.getRelayPairCode(),
      adminApiKey: options.adminApiKey,
    }),
  });

  if (!response.ok) {
    throw await buildRelayRequestError("Relay register", response, baseUrl);
  }
}

async function pullRequest(
  baseUrl: string,
  options: RelayConnectorOptions,
): Promise<RelayQueuedRequest | null> {
  const response = await fetch(`${baseUrl}/api/v1/relay/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serverId: options.serverId,
      relaySecret: options.relaySecret,
      waitMs: options.waitMs ?? 20000,
    }),
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw await buildRelayRequestError("Relay pull", response, baseUrl);
  }

  const body = await response.json() as { success: true; data: RelayPullResult };
  return body.data.request;
}

async function sendResponse(
  baseUrl: string,
  options: RelayConnectorOptions,
  requestId: string,
  response: RelayQueuedResponse,
): Promise<void> {
  const relayResponse = await fetch(`${baseUrl}/api/v1/relay/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serverId: options.serverId,
      relaySecret: options.relaySecret,
      requestId,
      response,
    }),
  });

  if (!relayResponse.ok) {
    throw await buildRelayRequestError("Relay respond", relayResponse, baseUrl);
  }
}

async function processRelayRequest(
  options: RelayConnectorOptions,
  request: RelayQueuedRequest,
): Promise<RelayQueuedResponse> {
  const query = request.query ? `?${request.query}` : "";
  const targetUrl = `${options.localBaseUrl}${request.path}${query}`;
  const headers = stripForwardedHeaders(request.headers);
  const body = fromBase64(request.bodyBase64);

  const localResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders: Record<string, string> = {};
  for (const [key, value] of localResponse.headers.entries()) {
    if (SKIP_HEADERS.has(key.toLowerCase())) {
      continue;
    }
    responseHeaders[key] = value;
  }

  return {
    status: localResponse.status,
    headers: responseHeaders,
    bodyBase64: toBodyBase64(await localResponse.arrayBuffer()),
  };
}

/**
 * Starts relay connector loop. Returns a stop function.
 */
export function startRelayConnector(options: RelayConnectorOptions): { stop: () => void } {
  const relayBaseUrl = toBaseUrl(options.relayUrl);
  let stopped = false;
  let failureCount = 0;

  async function loop(): Promise<void> {
    while (!stopped) {
      try {
        await registerServer(relayBaseUrl, options);
        failureCount = 0;

        const request = await pullRequest(relayBaseUrl, options);
        if (!request) {
          continue;
        }

        const proxied = await processRelayRequest(options, request);
        await sendResponse(relayBaseUrl, options, request.requestId, proxied);
      } catch (error) {
        failureCount += 1;
        const backoffMs = Math.min(2000 * failureCount, 15000);
        const errObj = error instanceof Error ? error : new Error(String(error));
        logger.warn("Relay connector error", {
          error: errObj.message,
          name: errObj.name,
          cause: errObj.cause ? String(errObj.cause) : undefined,
          relayUrl: relayBaseUrl,
          backoffMs,
        });
        await sleep(backoffMs);
      }
    }
  }

  void loop();
  logger.info("Relay connector started", { relayUrl: relayBaseUrl, serverId: options.serverId });

  return {
    stop: () => {
      stopped = true;
      logger.info("Relay connector stopped");
    },
  };
}
