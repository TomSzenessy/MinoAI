/**
 * Vault Routes — compatibility with existing Obsidian vaults.
 *
 * Read-only inspection: what `.obsidian/` says about the vault, which
 * community plugins are installed and enabled, which themes and snippets exist.
 * Plugin code is never executed by this route.
 */

import { Hono } from "hono";
import type { AppContext } from "../types";
import { inspectObsidianVault } from "../services/obsidian-vault";

export function vaultRoutes(): Hono<AppContext> {
  const router = new Hono<AppContext>();

  /**
   * GET /api/v1/vault/obsidian
   * Inspect the Obsidian vault inside the data directory, if there is one.
   */
  router.get("/obsidian", (c) => {
    const dataDir = c.get("dataDir");
    const explicitRoot = process.env.MINO_OBSIDIAN_VAULT?.trim() || undefined;
    const summary = inspectObsidianVault(dataDir, explicitRoot);

    return c.json({
      success: true,
      data: summary,
    });
  });

  return router;
}
