/**
 * Settings Store
 * Manages app settings with persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, ServerConnection } from '@/types';

interface SettingsState extends AppSettings {
	// Server connection
	serverConnection: ServerConnection | null;

	// Actions
	setTheme: (theme: AppSettings['theme']) => void;
	setGridDensity: (density: AppSettings['gridDensity']) => void;
	setAutoSync: (autoSync: boolean) => void;
	setSyncInterval: (interval: number) => void;
	setHapticFeedback: (enabled: boolean) => void;
	setDefaultFolder: (folder: string) => void;
	setShowLineNumbers: (show: boolean) => void;
	setEditorFontSize: (size: number) => void;
	setShowPreview: (show: boolean) => void;

	// Server connection
	setServerConnection: (connection: ServerConnection | null) => void;
	updateConnectionStatus: (status: ServerConnection['status']) => void;
	clearServerConnection: () => void;

	// Reset
	resetSettings: () => void;
}

const defaultSettings: AppSettings = {
	theme: 'system',
	gridDensity: 'comfortable',
	autoSync: true,
	syncInterval: 5,
	hapticFeedback: true,
	defaultFolder: '',
	showLineNumbers: false,
	editorFontSize: 16,
	showPreview: false
};

export const useSettingsStore = create<SettingsState>()(
	persist(
		(set) => ({
			// Initial state
			...defaultSettings,
			serverConnection: null,

			// Actions
			setTheme: (theme) => set({ theme }),
			setGridDensity: (gridDensity) => set({ gridDensity }),
			setAutoSync: (autoSync) => set({ autoSync }),
			setSyncInterval: (syncInterval) => set({ syncInterval }),
			setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),
			setDefaultFolder: (defaultFolder) => set({ defaultFolder }),
			setShowLineNumbers: (showLineNumbers) => set({ showLineNumbers }),
			setEditorFontSize: (editorFontSize) => set({ editorFontSize }),
			setShowPreview: (showPreview) => set({ showPreview }),

			// Server connection
			setServerConnection: (serverConnection) =>
				set({ serverConnection }),
			updateConnectionStatus: (status) =>
				set((state) => ({
					serverConnection: state.serverConnection
						? { ...state.serverConnection, status }
						: null
				})),
			clearServerConnection: () => set({ serverConnection: null }),

			// Reset
			resetSettings: () =>
				set({ ...defaultSettings, serverConnection: null })
		}),
		{
			name: 'mino-settings',
			storage: createJSONStorage(() => AsyncStorage)
		}
	)
);

export default useSettingsStore;
