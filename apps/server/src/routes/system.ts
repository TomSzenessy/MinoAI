/**
 * System Routes — Server capabilities and configuration.
 *
 * Protected (auth required). Returns detected resources
 * and public configuration.
 */

import { Hono } from "hono";
import { cpus, totalmem, freemem } from "node:os";
import type { AppContext } from "../types";

export function systemRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  /**
   * GET /api/v1/system/capabilities
   * Returns detected system resources and enabled features.
   */
  router.get("/capabilities", (c) => {
    const cpu = cpus();
    const cpuModel = cpu[0]?.model ?? "Unknown";
    const cpuCores = Math.max(cpu.length, 1);
    const totalMB = Math.round(totalmem() / 1024 / 1024);
    const availableMB = Math.round(freemem() / 1024 / 1024);

    return c.json({
      success: true,
      data: {
        resources: {
          cpu: { cores: cpuCores, model: cpuModel },
          ram: { totalMB, availableMB },
          gpu: { available: false }, // TODO: GPU detection in Phase 2
          disk: { totalGB: 0, availableGB: 0 }, // TODO: disk detection
        },
        capabilities: {
          localWhisper: totalMB > 4096,
          localOCR: false, // TODO: detect Tesseract binary
          localEmbeddings: totalMB > 2048,
          localLLM: false,  // TODO: GPU detection
          sandbox: false,   // TODO: Docker socket detection
          maxConcurrentRequests: Math.max(4, cpuCores * 2),
        },
      },
    });
  });

  /**
   * GET /api/v1/config
   * Returns the public server configuration (no secrets).
   */
  router.get("/config", (c) => {
    const config = c.get("config");

    // Return config without sensitive fields
    return c.json({
      success: true,
      data: {
        server: {
          port: config.server.port,
          cors: config.server.cors,
        },
        auth: {
          mode: config.auth.mode,
        },
        agent: {
          enabled: config.agent.enabled,
          provider: config.agent.provider,
          model: config.agent.model,
          // apiKey is intentionally omitted
        },
        search: config.search,
        sync: config.sync,
        plugins: {
          enabled: config.plugins.enabled,
        },
      },
    });
  });

  return router;
}
