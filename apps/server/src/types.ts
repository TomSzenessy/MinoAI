/**
 * AppContext — Hono context type with injected dependencies.
 *
 * All routes/middleware access shared state through `c.get("key")`
 * instead of module-level globals for testability and isolation.
 */

import type { Credentials, ServerConfig } from "@mino-ink/shared";

export type AppContext = {
  Variables: {
    /** Server configuration loaded from /data/config.json. */
    config: ServerConfig;
    /** Auto-generated server credentials. */
    credentials: Credentials;
    /** Absolute path to the data directory. */
    dataDir: string;
    /** Server version string. */
    version: string;
    /** Optional static web dist directory for built-in UI serving. */
    webDistDir: string | null;
  };
};
