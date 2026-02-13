/**
 * ResourceDetector — System resource detection for Mino.
 *
 * Detects CPU, RAM, GPU, and disk resources to enable
 * resource-aware features like local Whisper, OCR, and embeddings.
 *
 * Works on Linux, macOS, and Windows (with varying levels of detail).
 */

import { execSync } from "node:child_process";
import { platform, cpus, freemem, totalmem } from "node:os";
import { existsSync, statfsSync } from "node:fs";
import { join } from "node:path";
import type { ResourceProfile, SystemCapabilities } from "@mino-ink/shared";

/** Detected GPU information. */
export interface GpuInfo {
  available: boolean;
  name?: string;
  vramMB?: number;
  vendor?: "nvidia" | "amd" | "apple" | "intel" | "unknown";
}

/** Options for resource detection. */
export interface ResourceDetectorOptions {
  /** Data directory for disk space check. */
  dataDir?: string;
  /** Whether to detect GPU (can be slow). */
  detectGpu?: boolean;
}

/**
 * Detects system resources for capability-aware feature enablement.
 */
export class ResourceDetector {
  private options: ResourceDetectorOptions;

  constructor(options: ResourceDetectorOptions = {}) {
    this.options = {
      dataDir: options.dataDir ?? "/data",
      detectGpu: options.detectGpu ?? true,
    };
  }

  /**
   * Gets the complete resource profile of the system.
   */
  getProfile(): ResourceProfile {
    return {
      cpu: this.getCpuInfo(),
      ram: this.getRamInfo(),
      gpu: this.options.detectGpu ? this.getGpuInfo() : { available: false },
      disk: this.getDiskInfo(),
    };
  }

  /**
   * Determines system capabilities based on detected resources.
   */
  getCapabilities(profile?: ResourceProfile): SystemCapabilities {
    const p = profile ?? this.getProfile();

    return {
      // Local Whisper: needs ~2GB RAM minimum, more for larger models
      localWhisper: this.canRunWhisper(p),

      // Local OCR (Tesseract): lightweight, runs on most systems
      localOCR: p.ram.availableMB >= 512,

      // Local embeddings: needs ~1GB RAM for sentence-transformers
      localEmbeddings: this.canRunEmbeddings(p),

      // Local LLM: needs GPU with sufficient VRAM or lots of RAM
      localLLM: this.canRunLocalLLM(p),

      // Sandbox: needs Docker-in-Docker support
      sandbox: this.canRunSandbox(),

      // Max concurrent requests based on CPU cores and RAM
      maxConcurrentRequests: this.calculateMaxConcurrent(p),
    };
  }

  // ===========================================================================
  // CPU Detection
  // ===========================================================================

  private getCpuInfo(): { cores: number; model: string } {
    const cpuInfo = cpus();
    const model = cpuInfo[0]?.model ?? "Unknown CPU";

    return {
      cores: cpuInfo.length,
      model: model.trim(),
    };
  }

  // ===========================================================================
  // RAM Detection
  // ===========================================================================

  private getRamInfo(): { totalMB: number; availableMB: number } {
    return {
      totalMB: Math.round(totalmem() / (1024 * 1024)),
      availableMB: Math.round(freemem() / (1024 * 1024)),
    };
  }

  // ===========================================================================
  // GPU Detection
  // ===========================================================================

  private getGpuInfo(): GpuInfo {
    const currentPlatform = platform();

    // Apple Silicon detection (macOS)
    if (currentPlatform === "darwin") {
      return this.detectAppleGpu();
    }

    // NVIDIA GPU detection (Linux/Windows)
    const nvidiaGpu = this.detectNvidiaGpu();
    if (nvidiaGpu.available) {
      return nvidiaGpu;
    }

    // AMD GPU detection (Linux)
    const amdGpu = this.detectAmdGpu();
    if (amdGpu.available) {
      return amdGpu;
    }

    // Intel GPU detection (basic)
    const intelGpu = this.detectIntelGpu();
    if (intelGpu.available) {
      return intelGpu;
    }

    return { available: false };
  }

  private detectAppleGpu(): GpuInfo {
    try {
      // Check for Apple Silicon
      const cpuInfo = cpus()[0]?.model ?? "";
      if (cpuInfo.includes("Apple") || cpuInfo.includes("M1") || cpuInfo.includes("M2") || cpuInfo.includes("M3")) {
        // Apple Silicon has unified memory - estimate GPU portion
        const totalRamMB = Math.round(totalmem() / (1024 * 1024));
        return {
          available: true,
          name: cpuInfo,
          vramMB: Math.round(totalRamMB * 0.5), // Assume half for GPU
          vendor: "apple",
        };
      }

      // Intel Mac - check for discrete GPU
      const output = execSync("system_profiler SPDisplaysDataType 2>/dev/null", {
        encoding: "utf-8",
        timeout: 5000,
      });

      if (output.includes("AMD") || output.includes("Radeon")) {
        return {
          available: true,
          name: "AMD Radeon",
          vendor: "amd",
        };
      }

      return { available: false };
    } catch {
      return { available: false };
    }
  }

  private detectNvidiaGpu(): GpuInfo {
    try {
      // Try nvidia-smi
      const output = execSync("nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null", {
        encoding: "utf-8",
        timeout: 5000,
      });

      const lines = output.trim().split("\n");
      if (lines.length > 0 && lines[0]) {
        const [name, memory] = lines[0].split(",");
        const vramMB = memory ? parseInt(memory.trim().split(" ")[0] ?? "0", 10) : undefined;

        return {
          available: true,
          name: name?.trim(),
          vramMB: vramMB && !isNaN(vramMB) ? vramMB : undefined,
          vendor: "nvidia",
        };
      }
    } catch {
      // nvidia-smi not found or failed
    }

    return { available: false };
  }

  private detectAmdGpu(): GpuInfo {
    try {
      const currentPlatform = platform();

      if (currentPlatform === "linux") {
        // Check for AMD GPU via sysfs
        if (existsSync("/sys/class/drm/card0/device/vendor")) {
          const output = execSync("cat /sys/class/drm/card0/device/device 2>/dev/null", {
            encoding: "utf-8",
            timeout: 2000,
          });

          if (output) {
            return {
              available: true,
              name: "AMD GPU",
              vendor: "amd",
            };
          }
        }
      }
    } catch {
      // AMD detection failed
    }

    return { available: false };
  }

  private detectIntelGpu(): GpuInfo {
    try {
      const currentPlatform = platform();

      if (currentPlatform === "linux") {
        // Check for Intel GPU
        const output = execSync("lspci 2>/dev/null | grep -i vga | grep -i intel", {
          encoding: "utf-8",
          timeout: 5000,
        });

        if (output.trim()) {
          return {
            available: true,
            name: "Intel GPU",
            vendor: "intel",
          };
        }
      }
    } catch {
      // Intel detection failed
    }

    return { available: false };
  }

  // ===========================================================================
  // Disk Detection
  // ===========================================================================

  private getDiskInfo(): { totalGB: number; availableGB: number } {
    try {
      const dataDir = this.options.dataDir ?? "/data";
      const targetDir = existsSync(dataDir) ? dataDir : process.cwd();

      // Use statfs for disk space (available in Node.js 18.15+)
      const stats = statfsSync(targetDir);

      // stats.bsize is block size, stats.bavail is available blocks
      const totalBytes = stats.blocks * stats.bsize;
      const availableBytes = stats.bavail * stats.bsize;

      return {
        totalGB: Math.round(totalBytes / (1024 * 1024 * 1024)),
        availableGB: Math.round(availableBytes / (1024 * 1024 * 1024)),
      };
    } catch {
      // Fallback: assume reasonable defaults
      return {
        totalGB: 100,
        availableGB: 50,
      };
    }
  }

  // ===========================================================================
  // Capability Calculations
  // ===========================================================================

  private canRunWhisper(profile: ResourceProfile): boolean {
    // Whisper models need:
    // - tiny: ~1GB RAM
    // - base: ~1GB RAM
    // - small: ~2GB RAM
    // - medium: ~5GB RAM
    // - large: ~10GB RAM

    // With GPU, can run larger models
    if (profile.gpu.available && (profile.gpu.vramMB ?? 0) >= 2000) {
      return true;
    }

    // Without GPU, need sufficient system RAM
    return profile.ram.availableMB >= 2000;
  }

  private canRunEmbeddings(profile: ResourceProfile): boolean {
    // sentence-transformers/all-MiniLM-L6-v2 needs ~500MB-1GB
    // Larger models need more

    if (profile.gpu.available) {
      return true; // GPU acceleration available
    }

    return profile.ram.availableMB >= 1000;
  }

  private canRunLocalLLM(profile: ResourceProfile): boolean {
    // Local LLM needs significant resources:
    // - 7B model: ~8GB VRAM/RAM (quantized)
    // - 13B model: ~16GB VRAM/RAM
    // - 30B+ model: 24GB+ VRAM

    const gpuVendor = (profile.gpu as GpuInfo).vendor;

    // With NVIDIA GPU
    if (gpuVendor === "nvidia" && (profile.gpu.vramMB ?? 0) >= 6000) {
      return true;
    }

    // Apple Silicon with unified memory
    if (gpuVendor === "apple" && profile.ram.totalMB >= 16000) {
      return true;
    }

    // CPU-only inference (slow but possible with enough RAM)
    if (profile.ram.availableMB >= 12000) {
      return true;
    }

    return false;
  }

  private canRunSandbox(): boolean {
    // Check if Docker is available and supports Docker-in-Docker
    try {
      execSync("docker info 2>/dev/null", {
        encoding: "utf-8",
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }

  private calculateMaxConcurrent(profile: ResourceProfile): number {
    // Base on CPU cores and available RAM
    const cpuBased = profile.cpu.cores * 2;
    const ramBased = Math.floor(profile.ram.availableMB / 512); // 512MB per request

    // Use the lower bound, minimum 2, maximum 20
    return Math.max(2, Math.min(20, Math.min(cpuBased, ramBased)));
  }
}

/**
 * Quick helper to get system capabilities.
 */
export function getSystemCapabilities(dataDir?: string): SystemCapabilities {
  const detector = new ResourceDetector({ dataDir });
  return detector.getCapabilities();
}

/**
 * Quick helper to get resource profile.
 */
export function getResourceProfile(dataDir?: string): ResourceProfile {
  const detector = new ResourceDetector({ dataDir });
  return detector.getProfile();
}
