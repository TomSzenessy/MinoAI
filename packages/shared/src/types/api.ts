/**
 * API types — Shared request/response envelopes and error format.
 *
 * All API responses use a consistent envelope so clients can
 * handle success and error cases uniformly.
 */

/** Standard success response wrapper. */
export interface ApiResponse<T> {
  /** Whether the request succeeded. */
  success: true;
  /** Response payload. */
  data: T;
}

/** Standard error response. */
export interface ApiError {
  /** Whether the request succeeded. */
  success: false;
  /** Error details. */
  error: {
    /** Machine-readable error code. */
    code: string;
    /** Human-readable error message. */
    message: string;
    /** Optional additional details (validation errors, etc.). */
    details?: unknown;
  };
}

/** Paginated list response. */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    /** Cursor to pass for the next page, or null if last page. */
    nextCursor: string | null;
    /** Whether there are more results. */
    hasMore: boolean;
    /** Total count (if available, may be null for performance). */
    total?: number;
  };
}

/** Pagination query parameters. */
export interface PaginationParams {
  /** Cursor from a previous response (opaque string). */
  cursor?: string;
  /** Maximum number of results to return (default: 20, max: 100). */
  limit?: number;
}

/** Search query parameters. */
export interface SearchQuery {
  /** The search term. */
  q: string;
  /** Restrict search to a specific folder path. */
  folder?: string;
  /** Filter by tags. */
  tags?: string[];
  /** Maximum number of results. */
  limit?: number;
}

/** A single search result with relevance snippet. */
export interface SearchResult {
  /** Note path. */
  path: string;
  /** Note title. */
  title: string;
  /** Snippet of content around the match (~200 chars). */
  snippet: string;
  /** Relevance score (higher = more relevant). */
  score: number;
  /** Tags on this note. */
  tags: string[];
}

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

/** Standard error codes used across all Mino endpoints. */
export const API_ERROR_CODES = {
  // 400
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  // 401
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_API_KEY: "INVALID_API_KEY",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  // 403
  FORBIDDEN: "FORBIDDEN",
  // 404
  NOT_FOUND: "NOT_FOUND",
  NOTE_NOT_FOUND: "NOTE_NOT_FOUND",
  FOLDER_NOT_FOUND: "FOLDER_NOT_FOUND",
  // 409
  CONFLICT: "CONFLICT",
  NOTE_ALREADY_EXISTS: "NOTE_ALREADY_EXISTS",
  // 429
  RATE_LIMITED: "RATE_LIMITED",
  // 500
  INTERNAL_ERROR: "INTERNAL_ERROR",
  INDEX_ERROR: "INDEX_ERROR",
} as const;
