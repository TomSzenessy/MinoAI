/**
 * Config Schema — Zod validation for config.json.
 *
 * Used to validate the config file on load and to type-check
 * config updates from the web UI.
 */

import { z } from "zod";

export const serverNetworkSchema = z.object({
  port: z.number().int().min(1).max(65535).default(3000),
  host: z.string().default("0.0.0.0"),
  cors: z.array(z.string().url().or(z.string().startsWith("http://localhost"))).default([]),
});

export const authConfigSchema = z.object({
  mode: z.enum(["api-key", "jwt", "none"]).default("api-key"),
  allowedOrigins: z.array(z.string()).default([]),
});

export const agentConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(["anthropic", "openai", "google", "local", ""]).default(""),
  model: z.string().default(""),
  apiKey: z.string().default(""),
  maxTokensPerRequest: z.number().int().min(256).max(200000).default(4096),
});

export const searchConfigSchema = z.object({
  fts: z.boolean().default(true),
  embeddings: z.boolean().default(false),
  embeddingProvider: z.enum(["openai", "local", "auto"]).default("auto"),
});

export const syncConfigSchema = z.object({
  websocket: z.boolean().default(true),
  fileWatcher: z.boolean().default(true),
});

export const pluginConfigSchema = z.object({
  enabled: z.array(z.string()).default([]),
  directory: z.string().default("/data/plugins"),
});

export const resourceConfigSchema = z.object({
  autoDetect: z.boolean().default(true),
  localWhisper: z.enum(["auto", "enabled", "disabled"]).default("auto"),
  localOCR: z.enum(["auto", "enabled", "disabled"]).default("auto"),
  localEmbeddings: z.enum(["auto", "enabled", "disabled"]).default("auto"),
});

/** Full server config schema — validates the entire config.json. */
export const serverConfigSchema = z.object({
  server: serverNetworkSchema,
  auth: authConfigSchema,
  agent: agentConfigSchema,
  search: searchConfigSchema,
  sync: syncConfigSchema,
  plugins: pluginConfigSchema,
  resources: resourceConfigSchema,
});
