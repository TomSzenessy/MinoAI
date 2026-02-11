/**
 * @mino-ink/shared — Core TypeScript types for the Mino platform.
 *
 * This package is the single source of truth for all interfaces
 * shared between server, web, mobile, and SDK.
 */

export type { Note, NoteMetadata, NoteFrontmatter, CreateNoteRequest, UpdateNoteRequest } from "./types/note";
export type { FolderNode, FolderTree } from "./types/note";
export type {
  ServerConfig,
  ConnectionConfig,
  AgentConfig,
  SearchConfig,
  PluginConfig,
  SyncConfig,
} from "./types/config";
export type { Credentials, ServerIdentity, AuthToken, ApiKeyInfo } from "./types/auth";
export type { SystemCapabilities, ResourceProfile, HealthStatus } from "./types/system";
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationParams,
  SearchQuery,
  SearchResult,
} from "./types/api";

/** Standard API error codes used across all Mino services. */
export { API_ERROR_CODES } from "./types/api";
