/**
 * System types — Server capabilities, health, and resource detection.
 */

/** Detected system resources (CPU, RAM, GPU, disk). */
export interface ResourceProfile {
  cpu: {
    cores: number;
    model: string;
  };
  ram: {
    totalMB: number;
    availableMB: number;
  };
  gpu: {
    available: boolean;
    name?: string;
    vramMB?: number;
  };
  disk: {
    totalGB: number;
    availableGB: number;
  };
}

/** Auto-detected server capabilities based on resources. */
export interface SystemCapabilities {
  /** Local Whisper speech-to-text is available. */
  localWhisper: boolean;
  /** Local OCR (Tesseract) is available. */
  localOCR: boolean;
  /** Local embedding generation is feasible. */
  localEmbeddings: boolean;
  /** Local LLM inference is feasible (GPU required). */
  localLLM: boolean;
  /** Sandbox container is available (Docker-in-Docker). */
  sandbox: boolean;
  /** Suggested max concurrent API requests based on resources. */
  maxConcurrentRequests: number;
}

/** Health check response. */
export interface HealthStatus {
  /** "ok" or "degraded". */
  status: "ok" | "degraded";
  /** Server version. */
  version: string;
  /** Uptime in seconds. */
  uptimeSeconds: number;
  /** Total number of indexed notes. */
  noteCount: number;
  /** Time of the last full index, or null if never indexed. */
  lastIndexedAt: string | null;
}
