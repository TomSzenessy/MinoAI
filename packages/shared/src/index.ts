/**
 * Shared utilities for the Mino platform.
 *
 * These utilities are used across server, web, and SDK.
 * Platform-specific utilities (like file system operations) remain in their respective apps.
 */

// Re-export types
export type {
	Note,
	NoteMetadata,
	NoteFrontmatter,
	CreateNoteRequest,
	UpdateNoteRequest
} from './types/note';
export type { FolderNode, FolderTree } from './types/note';
export type {
	ServerConfig,
	ServerNetworkConfig,
	AuthConfig,
	ConnectionConfig,
	AgentConfig,
	SearchConfig,
	PluginConfig,
	SyncConfig,
	ResourceConfig
} from './types/config';
export type {
	Credentials,
	ServerIdentity,
	AuthToken,
	ApiKeyInfo
} from './types/auth';
export type {
	SystemCapabilities,
	ResourceProfile,
	HealthStatus
} from './types/system';
export type {
	ApiResponse,
	ApiError,
	PaginatedResponse,
	PaginationParams,
	SearchQuery,
	SearchResult
} from './types/api';

/** Standard API error codes used across all Mino services. */
export { API_ERROR_CODES } from './types/api';

// ---------------------------------------------------------------------------
// Path utilities (platform-agnostic)
// ---------------------------------------------------------------------------

/**
 * Normalizes a path to use forward slashes consistently.
 * Works for both file paths and URL paths.
 */
export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/');
}

/**
 * Joins path segments with forward slashes.
 * Handles leading/trailing slashes correctly.
 */
export function joinPaths(...segments: string[]): string {
	const joined = segments
		.map((s, i) => {
			const normalized = s.replace(/\\/g, '/');
			if (i === 0) return normalized.replace(/\/+$/, '');
			return normalized.replace(/^\/+|\/+$/g, '');
		})
		.filter(Boolean)
		.join('/');
	return joined || '.';
}

/**
 * Extracts the directory name from a path.
 * Similar to Node's path.dirname but works in any environment.
 */
export function getDirname(path: string): string {
	const normalized = normalizePath(path);
	const lastSlash = normalized.lastIndexOf('/');
	if (lastSlash === -1) return '.';
	if (lastSlash === 0) return '/';
	return normalized.slice(0, lastSlash);
}

/**
 * Extracts the file name from a path (including extension).
 * Similar to Node's path.basename but works in any environment.
 */
export function getBasename(path: string): string {
	const normalized = normalizePath(path);
	const lastSlash = normalized.lastIndexOf('/');
	return normalized.slice(lastSlash + 1);
}

/**
 * Extracts the file extension from a path (including the dot).
 * Returns empty string if no extension.
 */
export function getExtension(path: string): string {
	const basename = getBasename(path);
	const lastDot = basename.lastIndexOf('.');
	if (lastDot === -1 || lastDot === 0) return '';
	return basename.slice(lastDot);
}

/**
 * Changes or adds a file extension to a path.
 */
export function withExtension(path: string, ext: string): string {
	const dir = getDirname(path);
	const basename = getBasename(path);
	const lastDot = basename.lastIndexOf('.');
	const nameWithoutExt =
		lastDot === -1 ? basename : basename.slice(0, lastDot);
	const newBasename =
		nameWithoutExt + (ext.startsWith('.') ? ext : `.${ext}`);
	return dir === '.' ? newBasename : `${dir}/${newBasename}`;
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

/**
 * Truncates a string to a maximum length, adding ellipsis if needed.
 * Preserves word boundaries when possible.
 */
export function truncate(
	str: string,
	maxLength: number,
	ellipsis = '…'
): string {
	if (str.length <= maxLength) return str;
	const truncated = str.slice(0, maxLength - ellipsis.length);
	const lastSpace = truncated.lastIndexOf(' ');
	if (lastSpace > maxLength * 0.5) {
		return truncated.slice(0, lastSpace) + ellipsis;
	}
	return truncated + ellipsis;
}

/**
 * Creates a slug from a string (lowercase, alphanumeric, dashes).
 * Useful for generating note paths from titles.
 */
export function slugify(str: string): string {
	return str
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // Remove non-word chars
		.replace(/[\s_-]+/g, '-') // Convert spaces/underscores to dashes
		.replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Escapes HTML special characters in a string.
 */
export function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Date utilities
// ---------------------------------------------------------------------------

/**
 * Formats a date as ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ).
 * Uses UTC timezone for consistency across environments.
 */
export function toIsoDate(date: Date | number | string): string {
	const d = date instanceof Date ? date : new Date(date);
	return d.toISOString();
}

/**
 * Formats a date as a human-readable relative time.
 * E.g., "2 hours ago", "3 days ago", "just now"
 */
export function toRelativeTime(date: Date | number | string): string {
	const d = date instanceof Date ? date : new Date(date);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);
	const diffWeek = Math.floor(diffDay / 7);
	const diffMonth = Math.floor(diffDay / 30);
	const diffYear = Math.floor(diffDay / 365);

	if (diffSec < 60) return 'just now';
	if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
	if (diffHour < 24)
		return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
	if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
	if (diffWeek < 4) return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`;
	if (diffMonth < 12)
		return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
	return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`;
}

/**
 * Formats a date as a filename-friendly string (YYYY-MM-DD).
 */
export function toDateString(date: Date | number | string): string {
	const d = date instanceof Date ? date : new Date(date);
	return d.toISOString().split('T')[0] || '';
}

// ---------------------------------------------------------------------------
// ID generation (cryptographically secure, works in browser and Node)
// ---------------------------------------------------------------------------

/**
 * Generates a random ID string using crypto.randomUUID if available,
 * falling back to a secure alternative for older environments.
 */
export function generateId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback for older environments
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Generates a short random ID (8 characters, alphanumeric).
 * Useful for non-critical identifiers like temporary keys.
 */
export function generateShortId(length = 8): string {
	const chars =
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		const bytes = new Uint8Array(length);
		crypto.getRandomValues(bytes);
		for (let i = 0; i < length; i++) {
			result += chars[bytes[i]! % chars.length];
		}
	} else {
		for (let i = 0; i < length; i++) {
			result += chars[Math.floor(Math.random() * chars.length)];
		}
	}
	return result;
}

// ---------------------------------------------------------------------------
// Object utilities
// ---------------------------------------------------------------------------

/**
 * Deep clones an object (handles JSON-serializable data).
 * For complex objects with functions/symbols, use structuredClone if available.
 */
export function deepClone<T>(obj: T): T {
	if (typeof structuredClone === 'function') {
		return structuredClone(obj);
	}
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Picks specified keys from an object.
 */
export function pick<T extends object, K extends keyof T>(
	obj: T,
	keys: K[]
): Pick<T, K> {
	const result = {} as Pick<T, K>;
	for (const key of keys) {
		if (key in obj) {
			result[key] = obj[key];
		}
	}
	return result;
}

/**
 * Omits specified keys from an object.
 */
export function omit<T extends object, K extends keyof T>(
	obj: T,
	keys: K[]
): Omit<T, K> {
	const result = { ...obj };
	for (const key of keys) {
		delete result[key];
	}
	return result;
}

/**
 * Checks if a value is a plain object (not null, not array, object typeof).
 */
export function isPlainObject(
	value: unknown
): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Array utilities
// ---------------------------------------------------------------------------

/**
 * Groups array items by a key function.
 */
export function groupBy<T, K extends string | number | symbol>(
	array: T[],
	keyFn: (item: T) => K
): Record<K, T[]> {
	return array.reduce(
		(acc, item) => {
			const key = keyFn(item);
			if (!acc[key]) {
				acc[key] = [];
			}
			acc[key].push(item);
			return acc;
		},
		{} as Record<K, T[]>
	);
}

/**
 * Removes duplicates from an array based on a key function.
 */
export function uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
	const seen = new Set<K>();
	return array.filter((item) => {
		const key = keyFn(item);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

/**
 * Chunks an array into smaller arrays of specified size.
 */
export function chunk<T>(array: T[], size: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		result.push(array.slice(i, i + size));
	}
	return result;
}

// ---------------------------------------------------------------------------
// Async utilities
// ---------------------------------------------------------------------------

/**
 * Delays execution for a specified number of milliseconds.
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a function with exponential backoff.
 */
export async function retry<T>(
	fn: () => Promise<T>,
	options: {
		maxAttempts?: number;
		initialDelay?: number;
		maxDelay?: number;
		backoffFactor?: number;
	} = {}
): Promise<T> {
	const {
		maxAttempts = 3,
		initialDelay = 1000,
		maxDelay = 30000,
		backoffFactor = 2
	} = options;

	let lastError: Error | undefined;
	let currentDelay = initialDelay;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError =
				error instanceof Error ? error : new Error(String(error));
			if (attempt === maxAttempts) break;
			await delay(currentDelay);
			currentDelay = Math.min(currentDelay * backoffFactor, maxDelay);
		}
	}

	throw lastError;
}

/**
 * Runs async operations in parallel with a concurrency limit.
 */
export async function parallelLimit<T, R>(
	items: T[],
	fn: (item: T) => Promise<R>,
	concurrency: number
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let currentIndex = 0;

	async function runNext(): Promise<void> {
		while (currentIndex < items.length) {
			const index = currentIndex++;
			results[index] = await fn(items[index]!);
		}
	}

	await Promise.all(
		Array(Math.min(concurrency, items.length)).fill(null).map(runNext)
	);
	return results;
}
