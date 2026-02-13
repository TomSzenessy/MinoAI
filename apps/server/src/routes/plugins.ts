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

  router.get("/runtime", async (c) => {
    const service = new PluginService(c.get("dataDir"));
    const registry = await service.runtimeRegistry();
    return c.json({ success: true, data: registry });
  });

  router.get("/catalog", async (c) => {
    const service = new PluginService(c.get("dataDir"));
    const catalog = await service.listCatalog();
    return c.json({ success: true, data: catalog });
  });

  router.post("/install", async (c) => {
    const body = await c.req.json<{ id?: string }>();
    if (!body.id || body.id.trim().length === 0) {
      throw new HttpError(400, "VALIDATION_ERROR", "id is required");
    }

    const service = new PluginService(c.get("dataDir"));
    const plugin = await service.installPlugin(body.id);
    if (!plugin) {
      throw new HttpError(404, "PLUGIN_NOT_FOUND", `Plugin ${body.id} is not in catalog.`);
    }

    return c.json({ success: true, data: plugin }, 201);
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

  router.put("/:id/config", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<{ config?: Record<string, unknown> }>();
    if (!body.config || typeof body.config !== "object") {
      throw new HttpError(400, "VALIDATION_ERROR", "config object is required");
    }

    const service = new PluginService(c.get("dataDir"));
    const plugin = await service.updatePluginConfig(id, body.config);
    if (!plugin) {
      throw new HttpError(404, "PLUGIN_NOT_FOUND", `Plugin ${id} not found.`);
    }

    return c.json({ success: true, data: plugin });
  });

  router.delete("/:id", async (c) => {
    const id = c.req.param("id");
    const service = new PluginService(c.get("dataDir"));
    const removed = await service.uninstallPlugin(id);

    if (!removed) {
      throw new HttpError(404, "PLUGIN_NOT_FOUND", `Plugin ${id} not found.`);
    }

    return c.json({
      success: true,
      data: {
        deleted: id,
      },
    });
  });

  return router;
}
