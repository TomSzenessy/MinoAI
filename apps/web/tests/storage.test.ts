import { describe, expect, it } from "bun:test";
import { createProfileId, readStore, upsertProfile, type StorageLike } from "../lib/storage";

class MemoryStorage implements StorageLike {
  private readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe("profile storage", () => {
  it("creates deterministic ids", () => {
    const id1 = createProfileId("https://a.example");
    const id2 = createProfileId("https://a.example");
    expect(id1).toBe(id2);
  });

  it("upserts without duplicates", () => {
    const storage = new MemoryStorage();

    upsertProfile(
      {
        serverUrl: "https://a.example",
        apiKey: "mino_sk_1",
        setupComplete: true,
        source: "manual",
      },
      storage,
    );

    upsertProfile(
      {
        serverUrl: "https://a.example",
        apiKey: "mino_sk_2",
        setupComplete: true,
        source: "manual",
      },
      storage,
    );

    const store = readStore(storage);
    expect(store.profiles).toHaveLength(1);
    expect(store.profiles[0]?.apiKey).toBe("mino_sk_2");
    expect(store.activeProfileId).toBe(store.profiles[0]?.id ?? null);
  });
});
