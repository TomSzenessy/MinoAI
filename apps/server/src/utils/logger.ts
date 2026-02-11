/**
 * Logger — Structured logging utility.
 *
 * Uses a simple, zero-dependency logger that outputs plain text.
 * All server modules import from here so the logging format is
 * consistent everywhere.
 *
 * Format:  LEVEL message [data]
 * Example: INF Server listening on http://0.0.0.0:3000
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: "DBG",
  info: "INF",
  warn: "WRN",
  error: "ERR",
};

/** Current minimum log level (configurable via MINO_LOG_LEVEL env var). */
const minLevel: number = LOG_LEVELS[(process.env.MINO_LOG_LEVEL as LogLevel) ?? "info"] ?? LOG_LEVELS.info;

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
  const prefix = LEVEL_LABELS[level];
  const suffix = data !== undefined ? ` ${typeof data === "object" ? JSON.stringify(data) : data}` : "";
  return `${prefix} ${message}${suffix}\n`;
}

function log(level: LogLevel, message: string, data?: unknown): void {
  if (LOG_LEVELS[level] < minLevel) return;
  const formatted = formatMessage(level, message, data);

  if (level === "error" || level === "warn") {
    process.stderr.write(formatted);
  } else {
    process.stdout.write(formatted);
  }
}

/** Structured logger instance used across the server. */
export const logger = {
  debug: (message: string, data?: unknown) => log("debug", message, data),
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
};
