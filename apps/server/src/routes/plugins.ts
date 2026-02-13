import { Hono } from "hono";
import type { AppContext } from "../types";
import { PluginService } from "../services/plugin-service";
import { HttpError } from "../middleware/error-handler";

export function pluginRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  router.get("/", async (c) => {
    const service = new PluginService(c.get("dataDir"));
    const plugins = await service.listPlugins();
    return c.json({ success: true, data: plugins });
  });

  router.post("/:id/toggle", async (c) => {
    const id = c.req.param("id");
    const { enabled } = await c.req.json<{ enabled: boolean }>();

    const service = new PluginService(c.get("dataDir"));
    const plugin = await service.togglePlugin(id, enabled);

    if (!plugin) {
      throw new HttpError(404, "PLUGIN_NOT_FOUND", `Plugin ${id} not found.`);
    }

    return c.json({ success: true, data: plugin });
  });

  return router;
}
