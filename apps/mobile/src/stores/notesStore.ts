/**
 * Notes Store
 * Manages all notes state with Zustand
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { LocalNote, SyncQueueItem } from '@/types';

interface NotesState {
  // State
  notes: Record<string, LocalNote>;
  notePaths: string[];
  syncQueue: SyncQueueItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setNotes: (notes: LocalNote[]) => void;
  addNote: (note: LocalNote) => void;
  updateNote: (path: string, updates: Partial<LocalNote>) => void;
  deleteNote: (path: string) => void;
  setNoteContent: (path: string, content: string) => void;
  toggleFavorite: (path: string) => void;
  
  // Sync queue
  addToSyncQueue: (item: SyncQueueItem) => void;
  removeFromSyncQueue: (id: string) => void;
  incrementRetryCount: (id: string) => void;
  
  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Selectors
  getNote: (path: string) => LocalNote | undefined;
  getNotesByFolder: (folder: string) => LocalNote[];
  getFavoriteNotes: () => LocalNote[];
  getDirtyNotes: () => LocalNote[];
  getPendingSyncCount: () => number;
}

export const useNotesStore = create<NotesState>()(
  immer((set, get) => ({
    // Initial state
    notes: {},
    notePaths: [],
    syncQueue: [],
    isLoading: false,
    error: null,

    // Actions
    setNotes: (notes) =>
      set((state) => {
        state.notes = {};
        state.notePaths = [];
        notes.forEach((note) => {
          state.notes[note.path] = note;
          state.notePaths.push(note.path);
        });
        state.notePaths.sort((a, b) => {
          const noteA = state.notes[a];
          const noteB = state.notes[b];
          if (!noteA || !noteB) return 0;
          return new Date(noteB.updatedAt).getTime() - new Date(noteA.updatedAt).getTime();
        });
      }),

    addNote: (note) =>
      set((state) => {
        state.notes[note.path] = note;
        state.notePaths.unshift(note.path);
      }),

    updateNote: (path, updates) =>
      set((state) => {
        const existing = state.notes[path];
        if (!existing) return;
        Object.assign(existing, updates);
        existing.updatedAt = new Date().toISOString();
      }),

    deleteNote: (path) =>
      set((state) => {
        delete state.notes[path];
        state.notePaths = state.notePaths.filter((p) => p !== path);
      }),

    setNoteContent: (path, content) =>
      set((state) => {
        const existing = state.notes[path];
        if (!existing) return;
        existing.content = content;
        existing.isDirty = true;
        existing.updatedAt = new Date().toISOString();
      }),

    toggleFavorite: (path) =>
      set((state) => {
        const existing = state.notes[path];
        if (!existing) return;
        existing.isFavorite = !existing.isFavorite;
      }),

    // Sync queue
    addToSyncQueue: (item) =>
      set((state) => {
        const existingIndex = state.syncQueue.findIndex(
          (i) => i.path === item.path && i.operation === item.operation
        );
        if (existingIndex === -1) {
          state.syncQueue.push(item);
        } else {
          state.syncQueue[existingIndex] = item;
        }
      }),

    removeFromSyncQueue: (id) =>
      set((state) => {
        state.syncQueue = state.syncQueue.filter((item) => item.id !== id);
      }),

    incrementRetryCount: (id) =>
      set((state) => {
        const item = state.syncQueue.find((i) => i.id === id);
        if (item) {
          item.retryCount += 1;
        }
      }),

    // UI state
    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    // Selectors
    getNote: (path) => get().notes[path],

    getNotesByFolder: (folder) => {
      const state = get();
      return state.notePaths
        .filter((path) => path.startsWith(folder + '/') || (folder === '' && !path.includes('/')))
        .map((path) => state.notes[path])
        .filter((note): note is LocalNote => Boolean(note));
    },

    getFavoriteNotes: () => {
      const state = get();
      return state.notePaths
        .map((path) => state.notes[path])
        .filter((note): note is LocalNote => Boolean(note?.isFavorite));
    },

    getDirtyNotes: () => {
      const state = get();
      return state.notePaths
        .map((path) => state.notes[path])
        .filter((note): note is LocalNote => Boolean(note?.isDirty));
    },

    getPendingSyncCount: () => get().syncQueue.length,
  }))
);

export default useNotesStore;
