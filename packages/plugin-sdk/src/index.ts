/**
 * @mino-ink/plugin-sdk — Plugin SDK for Mino.
 *
 * Provides the `definePlugin()` API for creating Mino plugins.
 * Plugins can extend Mino with new capabilities like:
 * - Custom tools for the AI agent
 * - Channel integrations (Telegram, WhatsApp, etc.)
 * - Import/export handlers
 * - Background processors
 *
 * @example
 * ```typescript
 * import { definePlugin, ToolDefinition } from "@mino-ink/plugin-sdk";
 *
 * export default definePlugin({
 *   id: "my-plugin",
 *   name: "My Plugin",
 *   version: "1.0.0",
 *   description: "A sample plugin",
 *   author: "Your Name",
 *
 *   tools: [
 *     {
 *       name: "my_tool",
 *       description: "Does something useful",
 *       parameters: z.object({ query: z.string() }),
 *       execute: async (args, context) => {
 *         return { result: `Processed: ${args.query}` };
 *       },
 *     },
 *   ],
 * });
 * ```
 */

import { z } from 'zod';

// ============================================================================
// Core Types
// ============================================================================

/** Plugin source type. */
export type PluginSource = 'builtin' | 'installed' | 'npm' | 'github';

/** Resource requirements for a plugin. */
export interface ResourceRequirements {
	/** Minimum RAM required in MB. */
	minRamMB?: number;
	/** GPU required. */
	gpu?: boolean;
	/** Minimum GPU VRAM in MB. */
	minVramMB?: number;
	/** External dependencies required. */
	dependencies?: string[];
}

/** Plugin configuration schema. */
export interface PluginConfigSchema {
	[key: string]: {
		type: 'string' | 'number' | 'boolean' | 'array' | 'object';
		description?: string;
		default?: unknown;
		required?: boolean;
		enum?: (string | number)[];
		min?: number;
		max?: number;
	};
}

/** Context provided to plugin functions. */
export interface PluginContext {
	/** Plugin configuration. */
	config: Record<string, unknown>;
	/** Data directory path. */
	dataDir: string;
	/** Server version. */
	serverVersion: string;
	/** Logger instance. */
	logger: PluginLogger;
	/** Fetch function with auth headers. */
	fetch: typeof fetch;
	/** System capabilities. */
	capabilities: {
		localWhisper: boolean;
		localOCR: boolean;
		localEmbeddings: boolean;
		localLLM: boolean;
	};
}

/** Logger interface for plugins. */
export interface PluginLogger {
	debug(message: string, ...args: unknown[]): void;
	info(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string, ...args: unknown[]): void;
}

// ============================================================================
// Tool System
// ============================================================================

/** Parameter schema (Zod type). */
export type ParameterSchema = z.ZodTypeAny;

/** Tool definition for AI agent. */
export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
	/** Tool name (must be unique, use plugin prefix). */
	name: string;
	/** Tool description for the AI. */
	description: string;
	/** Input parameter schema (Zod). */
	parameters: ParameterSchema;
	/** Execute the tool. */
	execute: (input: TInput, context: PluginContext) => Promise<TOutput>;
	/** Whether this tool modifies data (default: false). */
	destructive?: boolean;
	/** Whether this tool requires user confirmation. */
	requiresConfirmation?: boolean;
	/** Timeout in milliseconds. */
	timeout?: number;
}

// ============================================================================
// Channel System
// ============================================================================

/** Channel provider type. */
export type ChannelProvider =
	| 'telegram'
	| 'whatsapp'
	| 'discord'
	| 'slack'
	| 'email'
	| 'webhook';

/** Channel configuration. */
export interface ChannelConfig {
	/** Channel provider. */
	provider: ChannelProvider;
	/** Channel name. */
	name: string;
	/** Provider-specific configuration. */
	config: Record<string, unknown>;
	/** Whether channel is enabled. */
	enabled: boolean;
}

/** Channel handler for incoming messages. */
export interface ChannelHandler {
	/** Provider type. */
	provider: ChannelProvider;
	/** Handle incoming webhook. */
	handleWebhook: (
		payload: unknown,
		headers: Record<string, string>,
		context: PluginContext
	) => Promise<void>;
	/** Validate webhook signature. */
	validateSignature?: (
		payload: unknown,
		signature: string,
		context: PluginContext
	) => boolean;
	/** Get channel configuration schema. */
	getConfigSchema: () => PluginConfigSchema;
}

// ============================================================================
// Import/Export System
// ============================================================================

/** Import handler for importing external data. */
export interface ImportHandler {
	/** Import format name. */
	format: string;
	/** File extensions supported. */
	extensions: string[];
	/** Import function. */
	import: (
		source: string | Buffer,
		options: Record<string, unknown>,
		context: PluginContext
	) => Promise<ImportResult>;
}

/** Result of an import operation. */
export interface ImportResult {
	/** Number of items imported. */
	count: number;
	/** Imported item paths. */
	paths: string[];
	/** Any warnings. */
	warnings?: string[];
}

/** Export handler for exporting data. */
export interface ExportHandler {
	/** Export format name. */
	format: string;
	/** File extension. */
	extension: string;
	/** Export function. */
	export: (
		paths: string[],
		options: Record<string, unknown>,
		context: PluginContext
	) => Promise<Buffer | string>;
}

// ============================================================================
// Processor System
// ============================================================================

/** Background processor for periodic tasks. */
export interface ProcessorDefinition {
	/** Processor name. */
	name: string;
	/** Run interval in milliseconds. */
	interval: number;
	/** Process function. */
	process: (context: PluginContext) => Promise<void>;
	/** Whether to run on startup. */
	runOnStartup?: boolean;
}

// ============================================================================
// Plugin Definition
// ============================================================================

/** Complete plugin definition. */
export interface PluginDefinition {
	// Metadata
	/** Unique plugin ID (use kebab-case). */
	id: string;
	/** Human-readable name. */
	name: string;
	/** Plugin version (semver). */
	version: string;
	/** Plugin description. */
	description?: string;
	/** Plugin author. */
	author?: string;
	/** Plugin homepage URL. */
	homepage?: string;
	/** Plugin repository URL. */
	repository?: string;
	/** Plugin license. */
	license?: string;
	/** Plugin source. */
	source?: PluginSource;

	// Configuration
	/** Configuration schema. */
	configSchema?: PluginConfigSchema;
	/** Default configuration. */
	defaultConfig?: Record<string, unknown>;
	/** Resource requirements. */
	resources?: ResourceRequirements;

	// Capabilities
	/** AI agent tools. */
	tools?: ToolDefinition[];
	/** Channel handlers. */
	channels?: ChannelHandler[];
	/** Import handlers. */
	importers?: ImportHandler[];
	/** Export handlers. */
	exporters?: ExportHandler[];
	/** Background processors. */
	processors?: ProcessorDefinition[];

	// Lifecycle
	/** Called when plugin is enabled. */
	onEnable?: (context: PluginContext) => Promise<void>;
	/** Called when plugin is disabled. */
	onDisable?: (context: PluginContext) => Promise<void>;
	/** Called when configuration changes. */
	onConfigChange?: (
		oldConfig: Record<string, unknown>,
		newConfig: Record<string, unknown>,
		context: PluginContext
	) => Promise<void>;
}

/** Validated plugin definition. */
export interface ValidatedPlugin extends PluginDefinition {
	/** Whether the plugin is valid. */
	_valid: true;
	/** Validation timestamp. */
	_validatedAt: string;
}

// ============================================================================
// Plugin Builder
// ============================================================================

/**
 * Defines a Mino plugin with full type safety.
 *
 * @param definition - Plugin definition
 * @returns Validated plugin definition
 *
 * @example
 * ```typescript
 * export default definePlugin({
 *   id: "web-search",
 *   name: "Web Search",
 *   version: "1.0.0",
 *   description: "Search the web from the AI agent",
 *
 *   tools: [
 *     {
 *       name: "web_search",
 *       description: "Search the web for information",
 *       parameters: z.object({
 *         query: z.string().describe("Search query"),
 *         limit: z.number().optional().default(5),
 *       }),
 *       execute: async (args, context) => {
 *         // Implementation
 *         return { results: [] };
 *       },
 *     },
 *   ],
 * });
 * ```
 */
export function definePlugin(definition: PluginDefinition): ValidatedPlugin {
	// Validate required fields
	if (!definition.id) {
		throw new Error("Plugin must have an 'id' field");
	}
	if (!definition.name) {
		throw new Error("Plugin must have a 'name' field");
	}
	if (!definition.version) {
		throw new Error("Plugin must have a 'version' field");
	}

	// Validate ID format (kebab-case)
	if (!/^[a-z][a-z0-9-]*$/.test(definition.id)) {
		throw new Error(
			`Plugin ID "${definition.id}" must be kebab-case (lowercase letters, numbers, hyphens)`
		);
	}

	// Validate version format (semver)
	if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(definition.version)) {
		throw new Error(
			`Plugin version "${definition.version}" must be semver format (e.g., "1.0.0")`
		);
	}

	// Validate tool names are prefixed with plugin ID
	if (definition.tools) {
		for (const tool of definition.tools) {
			if (!tool.name.startsWith(definition.id.replace(/-/g, '_') + '_')) {
				console.warn(
					`Tool "${tool.name}" should be prefixed with plugin ID for clarity (e.g., "${definition.id.replace(/-/g, '_')}_${tool.name}")`
				);
			}
		}
	}

	return {
		...definition,
		source: definition.source ?? 'installed',
		_valid: true,
		_validatedAt: new Date().toISOString()
	};
}

// ============================================================================
// Plugin Manifest Generator
// ============================================================================

/**
 * Generates a plugin.json manifest from a plugin definition.
 * Used for packaging plugins for distribution.
 */
export function generateManifest(
	definition: PluginDefinition
): Record<string, unknown> {
	return {
		id: definition.id,
		name: definition.name,
		version: definition.version,
		description: definition.description,
		author: definition.author,
		homepage: definition.homepage,
		repository: definition.repository,
		license: definition.license ?? 'MIT',
		configSchema: definition.configSchema,
		defaultConfig: definition.defaultConfig,
		resources: definition.resources,
		tools: definition.tools?.map((t) => ({
			name: t.name,
			description: t.description,
			destructive: t.destructive,
			requiresConfirmation: t.requiresConfirmation
		})),
		channels: definition.channels?.map((c) => ({
			provider: c.provider
		})),
		importers: definition.importers?.map((i) => ({
			format: i.format,
			extensions: i.extensions
		})),
		exporters: definition.exporters?.map((e) => ({
			format: e.format,
			extension: e.extension
		})),
		processors: definition.processors?.map((p) => ({
			name: p.name,
			interval: p.interval
		}))
	};
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Creates a simple tool definition with less boilerplate. */
export function createTool<TInput, TOutput>(
	name: string,
	description: string,
	parameters: ParameterSchema,
	execute: (input: TInput, context: PluginContext) => Promise<TOutput>
): ToolDefinition<TInput, TOutput> {
	return {
		name,
		description,
		parameters,
		execute
	};
}

/** Creates a simple channel handler. */
export function createChannelHandler(
	provider: ChannelProvider,
	handleWebhook: ChannelHandler['handleWebhook'],
	getConfigSchema?: () => PluginConfigSchema
): ChannelHandler {
	return {
		provider,
		handleWebhook,
		getConfigSchema: getConfigSchema ?? (() => ({}))
	};
}

/** Creates a simple import handler. */
export function createImporter(
	format: string,
	extensions: string[],
	importFn: ImportHandler['import']
): ImportHandler {
	return {
		format,
		extensions,
		import: importFn
	};
}

/** Creates a simple export handler. */
export function createExporter(
	format: string,
	extension: string,
	exportFn: ExportHandler['export']
): ExportHandler {
	return {
		format,
		extension,
		export: exportFn
	};
}

// ============================================================================
// Default Logger Implementation
// ============================================================================

/** Creates a default logger for plugins. */
export function createPluginLogger(pluginId: string): PluginLogger {
	const prefix = `[plugin:${pluginId}]`;
	return {
		debug: (message, ...args) => console.debug(prefix, message, ...args),
		info: (message, ...args) => console.info(prefix, message, ...args),
		warn: (message, ...args) => console.warn(prefix, message, ...args),
		error: (message, ...args) => console.error(prefix, message, ...args)
	};
}

// ============================================================================
// Exports
// ============================================================================

export default definePlugin;

// Re-export Zod for convenience
export { z };
