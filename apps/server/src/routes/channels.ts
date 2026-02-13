import { Hono } from "hono";
import type { AppContext } from "../types";
import {
  ChannelService,
  type ChannelProvider,
  type UpsertChannelInput,
} from "../services/channel-service";
import { AgentService } from "../services/agent-service";
import { HttpError } from "../middleware/error-handler";
import { resolveChannelProviderAdapter } from "../channels/registry";

function parseProvider(value: string): ChannelProvider | null {
  return resolveChannelProviderAdapter(value)?.provider ?? null;
}

export function channelRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  router.get("/providers", (c) => {
    const service = new ChannelService(c.get("dataDir"));
    return c.json({ success: true, data: service.listProviderCapabilities() });
  });

  router.get("/", (c) => {
    const service = new ChannelService(c.get("dataDir"));
    return c.json({ success: true, data: service.listChannels() });
  });

  router.post("/", async (c) => {
    const body = await c.req.json<UpsertChannelInput>();
    if (!body?.type || !parseProvider(body.type)) {
      throw new HttpError(400, "VALIDATION_ERROR", "type must be telegram or whatsapp");
    }
    if (!body.name || body.name.trim().length === 0) {
      throw new HttpError(400, "VALIDATION_ERROR", "name is required");
    }

    const adapter = resolveChannelProviderAdapter(body.type);
    if (!adapter) {
      throw new HttpError(400, "VALIDATION_ERROR", "unsupported provider");
    }
    const issues = adapter.validateCredentials(body.credentials ?? {});
    if (issues.length > 0) {
      throw new HttpError(400, "VALIDATION_ERROR", issues.join(", "));
    }

    const service = new ChannelService(c.get("dataDir"));
    const channel = service.upsertChannel(body);
    return c.json({ success: true, data: channel });
  });

  router.post("/:id/toggle", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<{ enabled?: boolean }>();
    if (typeof body.enabled !== "boolean") {
      throw new HttpError(400, "VALIDATION_ERROR", "enabled must be a boolean");
    }

    const service = new ChannelService(c.get("dataDir"));
    const channel = service.toggleChannel(id, body.enabled);
    if (!channel) {
      throw new HttpError(404, "CHANNEL_NOT_FOUND", `Channel ${id} not found.`);
    }

    return c.json({ success: true, data: channel });
  });

  router.delete("/:id", (c) => {
    const id = c.req.param("id");
    const service = new ChannelService(c.get("dataDir"));
    const removed = service.deleteChannel(id);
    if (!removed) {
      throw new HttpError(404, "CHANNEL_NOT_FOUND", `Channel ${id} not found.`);
    }

    return c.json({
      success: true,
      data: { deleted: id },
    });
  });

  return router;
}

export function channelWebhookRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  router.post("/:provider", async (c) => {
    const provider = parseProvider(c.req.param("provider"));
    if (!provider) {
      throw new HttpError(400, "VALIDATION_ERROR", "Unsupported provider");
    }

    const payload = await c.req.json().catch(() => null);
    if (!payload) {
      throw new HttpError(400, "VALIDATION_ERROR", "Invalid JSON payload");
    }

    const suppliedSecret = c.req.header("X-Mino-Channel-Secret") ?? c.req.query("secret");
    const channelService = new ChannelService(c.get("dataDir"));
    const agentService = new AgentService(c.get("dataDir"), c.get("config"));
    const result = await channelService.handleWebhook(
      provider,
      payload,
      suppliedSecret,
      agentService,
    );

    if (result.status === "unauthorized") {
      return c.json({ success: false, error: result }, 401);
    }

    const statusCode = result.status === "ignored" ? 202 : 200;
    return c.json({ success: true, data: result }, statusCode);
  });

  return router;
}
