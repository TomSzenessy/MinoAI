/**
 * UI Store
 * Manages transient UI state
 */

import { create } from 'zustand';
import type { UIState } from '@/types';

interface UIStore extends UIState {
	// Sidebar
	toggleSidebar: () => void;
	setSidebarOpen: (open: boolean) => void;

	// Search
	setSearchQuery: (query: string) => void;
	clearSearch: () => void;

	// Selection
	selectFolder: (folder: string | null) => void;
	selectNote: (path: string | null) => void;

	// Loading
	setLoading: (loading: boolean) => void;

	// Error
	setError: (error: string | null) => void;
	clearError: () => void;

	// Refresh
	setRefreshing: (refreshing: boolean) => void;

	// Reset
	resetUI: () => void;
}

const initialState: UIState = {
	sidebarOpen: false,
	searchQuery: '',
	selectedFolder: null,
	selectedNotePath: null,
	isLoading: false,
	error: null,
	isRefreshing: false
};

export const useUIStore = create<UIStore>((set) => ({
	...initialState,

	// Sidebar
	toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
	setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

	// Search
	setSearchQuery: (searchQuery) => set({ searchQuery }),
	clearSearch: () => set({ searchQuery: '' }),

	// Selection
	selectFolder: (selectedFolder) => set({ selectedFolder }),
	selectNote: (selectedNotePath) => set({ selectedNotePath }),

	// Loading
	setLoading: (isLoading) => set({ isLoading }),

	// Error
	setError: (error) => set({ error }),
	clearError: () => set({ error: null }),

	// Refresh
	setRefreshing: (isRefreshing) => set({ isRefreshing }),

	// Reset
	resetUI: () => set(initialState)
}));

export default useUIStore;
