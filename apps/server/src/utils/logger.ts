/**
 * Logger — Structured logging utility.
 *
 * Uses a simple, zero-dependency logger that outputs JSON in production
 * and pretty-prints in development. All server modules import from here
 * so the logging format is consistent everywhere.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Current minimum log level (configurable via MINO_LOG_LEVEL env var). */
const minLevel: number = LOG_LEVELS[(process.env.MINO_LOG_LEVEL as LogLevel) ?? "info"] ?? LOG_LEVELS.info;

/** Whether to output JSON (production) or pretty-print (development). */
const isProduction = process.env.NODE_ENV === "production";

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
  if (isProduction) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data !== undefined ? { data } : {}),
    });
  }

  const timestamp = new Date().toISOString().split("T")[1]?.slice(0, 12) ?? "";
  const prefix = `[${timestamp}] ${level.toUpperCase().padEnd(5)}`;
  const suffix = data !== undefined ? ` ${typeof data === "object" ? JSON.stringify(data) : data}` : "";
  return `${prefix} ${message}${suffix}`;
}

function log(level: LogLevel, message: string, data?: unknown): void {
  if (LOG_LEVELS[level] < minLevel) return;
  const formatted = formatMessage(level, message, data);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

/** Structured logger instance used across the server. */
export const logger = {
  debug: (message: string, data?: unknown) => log("debug", message, data),
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
};
