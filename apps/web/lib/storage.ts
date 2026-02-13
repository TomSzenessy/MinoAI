export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LinkedServerProfile {
  id: string;
  name: string;
  serverUrl: string;
  apiKey: string;
  serverId?: string;
  linkedAt: string;
  lastVerifiedAt: string;
  setupComplete: boolean;
  source: "link" | "manual" | "local" | "relay";
}

export interface LinkedServersStore {
  activeProfileId: string | null;
  profiles: LinkedServerProfile[];
}

export const LOCAL_PROFILE_ID = "local_demo_vault";

const STORAGE_KEY = "mino.linkedServers.v1";

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function defaultStore(): LinkedServersStore {
  return {
    activeProfileId: null,
    profiles: [],
  };
}

function parseStore(raw: string | null): LinkedServersStore {
  if (!raw) {
    return defaultStore();
  }

  try {
    const parsed = JSON.parse(raw) as LinkedServersStore;
    if (!Array.isArray(parsed.profiles)) {
      return defaultStore();
    }

    return {
      activeProfileId: parsed.activeProfileId ?? null,
      profiles: parsed.profiles,
    };
  } catch {
    return defaultStore();
  }
}

function writeStore(store: LinkedServersStore, storage?: StorageLike): void {
  const driver = getStorage(storage);
  if (!driver) {
    return;
  }

  driver.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function readStore(storage?: StorageLike): LinkedServersStore {
  const driver = getStorage(storage);
  if (!driver) {
    return defaultStore();
  }

  return parseStore(driver.getItem(STORAGE_KEY));
}

export function createProfileId(serverUrl: string): string {
  // FNV-1a for stable, deterministic ids from normalized URLs.
  let hash = 0x811c9dc5;
  for (let i = 0; i < serverUrl.length; i += 1) {
    hash ^= serverUrl.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `srv_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function defaultProfileName(serverUrl: string): string {
  try {
    const url = new URL(serverUrl);
    return url.hostname;
  } catch {
    return "Mino Server";
  }
}

export interface UpsertProfileInput {
  serverUrl: string;
  apiKey: string;
  serverId?: string;
  setupComplete: boolean;
  name?: string;
  source: LinkedServerProfile["source"];
}

export function upsertProfile(
  input: UpsertProfileInput,
  storage?: StorageLike,
): LinkedServerProfile {
  const now = new Date().toISOString();
  const store = readStore(storage);
  const id = createProfileId(input.serverUrl);
  const existing = store.profiles.find((profile) => profile.id === id);

  const nextProfile: LinkedServerProfile = {
    id,
    name: input.name?.trim() || existing?.name || defaultProfileName(input.serverUrl),
    serverUrl: input.serverUrl,
    apiKey: input.apiKey,
    serverId: input.serverId ?? existing?.serverId,
    linkedAt: existing?.linkedAt ?? now,
    lastVerifiedAt: now,
    setupComplete: input.setupComplete,
    source: input.source,
  };

  const profiles = existing
    ? store.profiles.map((profile) => (profile.id === id ? nextProfile : profile))
    : [...store.profiles, nextProfile];

  writeStore({
    activeProfileId: id,
    profiles,
  }, storage);

  return nextProfile;
}

export function getProfileById(
  profileId: string,
  storage?: StorageLike,
): LinkedServerProfile | null {
  const store = readStore(storage);
  return store.profiles.find((profile) => profile.id === profileId) ?? null;
}

export function getProfiles(storage?: StorageLike): LinkedServerProfile[] {
  return readStore(storage).profiles;
}

export function getActiveProfile(storage?: StorageLike): LinkedServerProfile | null {
  const store = readStore(storage);
  if (!store.activeProfileId) {
    return null;
  }

  return store.profiles.find((profile) => profile.id === store.activeProfileId) ?? null;
}

export function setActiveProfile(
  profileId: string,
  storage?: StorageLike,
): LinkedServerProfile | null {
  const store = readStore(storage);
  const profile = store.profiles.find((entry) => entry.id === profileId) ?? null;
  if (!profile) {
    return null;
  }

  writeStore(
    {
      ...store,
      activeProfileId: profileId,
    },
    storage,
  );

  return profile;
}

export function getFallbackProfile(storage?: StorageLike): LinkedServerProfile | null {
  const store = readStore(storage);
  const active = store.activeProfileId
    ? store.profiles.find((profile) => profile.id === store.activeProfileId)
    : null;

  if (active) {
    return active;
  }

  return store.profiles[0] ?? null;
}

export function getLocalDemoProfile(): LinkedServerProfile {
  return {
    id: LOCAL_PROFILE_ID,
    name: "Local Vault",
    serverUrl: "local://vault",
    apiKey: "local_demo_key",
    linkedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    setupComplete: true,
    source: "local",
  };
}
