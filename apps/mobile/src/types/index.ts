/**
 * Mobile app types.
 */

import type { ServerIdentity } from '@mino-ink/shared';

export type {
  Note,
  NoteMetadata,
  FolderTree,
  SearchResult,
  Credentials,
  ServerIdentity,
  SystemCapabilities,
  HealthStatus,
  ResourceProfile,
} from '@mino-ink/shared';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface ServerConnection {
  url: string;
  apiKey: string;
  relayCode?: string;
  status: ConnectionStatus;
  lastSyncAt?: string;
  serverIdentity?: ServerIdentity;
}

export interface LocalNote {
  path: string;
  title: string;
  folder: string;
  tags: string[];
  links: string[];
  backlinks: string[];
  checksum: string | null;
  frontmatter: string | null;
  wordCount: number;
  content: string;
  isDirty: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  syncVersion: number;
}

export interface SyncQueueItem {
  id: string;
  path: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: string;
  retryCount: number;
  payload?: unknown;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  gridDensity: 'compact' | 'comfortable' | 'spacious';
  autoSync: boolean;
  syncInterval: number;
  hapticFeedback: boolean;
  defaultFolder: string;
  showLineNumbers: boolean;
  editorFontSize: number;
  showPreview: boolean;
}

export interface UIState {
  sidebarOpen: boolean;
  searchQuery: string;
  selectedFolder: string | null;
  selectedNotePath: string | null;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
}

export interface NoteEditorParams {
  path?: string;
  folder?: string;
  focus?: boolean;
}

export interface RelayPairingState {
  isPairing: boolean;
  pairingCode?: string;
  error?: string;
  timeRemaining?: number;
}
