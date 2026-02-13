import { Hono } from "hono";
import type { AppContext } from "../types";
import { AgentService } from "../services/agent-service";
import { HttpError } from "../middleware/error-handler";

export function agentRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  router.get("/status", (c) => {
    const config = c.get("config");
    return c.json({
      success: true,
      data: {
        enabled: config.agent.enabled,
        provider: config.agent.provider || "local",
        model: config.agent.model || "mino-agent-rules",
      },
    });
  });

  router.post("/chat", async (c) => {
    const body = await c.req.json<{
      message?: string;
      notePath?: string;
      channel?: "telegram" | "whatsapp" | "web";
    }>();

    if (!body.message || body.message.trim().length === 0) {
      throw new HttpError(400, "VALIDATION_ERROR", "message is required");
    }

    const service = new AgentService(c.get("dataDir"), c.get("config"));
    const result = await service.chat({
      message: body.message,
      notePath: body.notePath,
      channel: body.channel ?? "web",
    });

    return c.json({
      success: true,
      data: result,
    });
  });

  return router;
}
