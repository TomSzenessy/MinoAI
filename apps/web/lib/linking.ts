import { linkServer, verifyServer } from "./api";
import { mapLinkError } from "./errors";
import { normalizeServerUrl } from "./url";
import { upsertProfile, type LinkedServerProfile } from "./storage";

export type LinkStep =
  | "validating"
  | "verifying"
  | "linking"
  | "persisting"
  | "done";

export interface RunLinkFlowInput {
  serverUrl: string;
  apiKey: string;
  name?: string;
  source: "link" | "manual" | "local";
  onStep?: (step: LinkStep) => void;
}

export interface RunLinkFlowResult {
  profile: LinkedServerProfile;
}

export async function runLinkFlow(
  input: RunLinkFlowInput,
): Promise<RunLinkFlowResult> {
  input.onStep?.("validating");

  const normalized = normalizeServerUrl(input.serverUrl);
  if (!normalized.ok || !normalized.value) {
    throw new Error(normalized.reason || "Invalid server URL.");
  }

  const apiKey = input.apiKey.trim();
  if (!apiKey) {
    throw new Error("API key is required.");
  }

  try {
    input.onStep?.("verifying");
    const verify = await verifyServer(normalized.value, apiKey);

    if (!verify.valid) {
      throw new Error("Server rejected API key.");
    }

    input.onStep?.("linking");
    const linked = await linkServer(normalized.value, apiKey);

    input.onStep?.("persisting");
    const profile = upsertProfile({
      serverUrl: normalized.value,
      apiKey,
      serverId: linked.serverId,
      setupComplete: linked.setupComplete,
      name: input.name,
      source: input.source,
    });

    input.onStep?.("done");

    return { profile };
  } catch (error) {
    throw new Error(mapLinkError(error));
  }
}
