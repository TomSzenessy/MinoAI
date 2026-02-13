/**
 * Storage Service
 * AsyncStorage wrapper for simple key-value storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
	SERVER_URL: 'mino_server_url',
	API_KEY: 'mino_api_key',
	RELAY_CODE: 'mino_relay_code',
	LAST_SYNC: 'mino_last_sync',
	USER_PREFERENCES: 'mino_user_preferences',
	ONBOARDING_COMPLETE: 'mino_onboarding_complete',
	CACHED_FOLDER_TREE: 'mino_cached_folder_tree'
} as const;

/**
 * Get a value from storage
 */
export async function getItem<T>(key: string): Promise<T | null> {
	try {
		const value = await AsyncStorage.getItem(key);
		if (value === null) return null;
		return JSON.parse(value) as T;
	} catch (error) {
		console.error(`Error getting item ${key}:`, error);
		return null;
	}
}

/**
 * Set a value in storage
 */
export async function setItem<T>(key: string, value: T): Promise<void> {
	try {
		await AsyncStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error(`Error setting item ${key}:`, error);
		throw error;
	}
}

/**
 * Remove a value from storage
 */
export async function removeItem(key: string): Promise<void> {
	try {
		await AsyncStorage.removeItem(key);
	} catch (error) {
		console.error(`Error removing item ${key}:`, error);
		throw error;
	}
}

/**
 * Check if a key exists
 */
export async function hasItem(key: string): Promise<boolean> {
	try {
		const value = await AsyncStorage.getItem(key);
		return value !== null;
	} catch (error) {
		console.error(`Error checking item ${key}:`, error);
		return false;
	}
}

/**
 * Get multiple items at once
 */
export async function multiGet<T>(
	keys: string[]
): Promise<Record<string, T | null>> {
	try {
		const pairs = await AsyncStorage.multiGet(keys);
		const result: Record<string, T | null> = {};
		pairs.forEach(([key, value]) => {
			result[key] = value ? JSON.parse(value) : null;
		});
		return result;
	} catch (error) {
		console.error('Error getting multiple items:', error);
		return {};
	}
}

/**
 * Set multiple items at once
 */
export async function multiSet(items: Record<string, unknown>): Promise<void> {
	try {
		const pairs: [string, string][] = Object.entries(items).map(
			([key, value]) => [key, JSON.stringify(value)]
		);
		await AsyncStorage.multiSet(pairs);
	} catch (error) {
		console.error('Error setting multiple items:', error);
		throw error;
	}
}

/**
 * Clear all app storage
 */
export async function clearAll(): Promise<void> {
	try {
		const keys = await AsyncStorage.getAllKeys();
		const minoKeys = keys.filter((key) => key.startsWith('mino_'));
		await AsyncStorage.multiRemove(minoKeys);
	} catch (error) {
		console.error('Error clearing storage:', error);
		throw error;
	}
}

/**
 * Get last sync timestamp
 */
export async function getLastSync(): Promise<string | null> {
	return getItem<string>(STORAGE_KEYS.LAST_SYNC);
}

/**
 * Set last sync timestamp
 */
export async function setLastSync(timestamp: string): Promise<void> {
	return setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(): Promise<boolean> {
	return hasItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(): Promise<void> {
	return setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
}

export default {
	getItem,
	setItem,
	removeItem,
	hasItem,
	multiGet,
	multiSet,
	clearAll,
	getLastSync,
	setLastSync,
	isOnboardingComplete,
	completeOnboarding,
	STORAGE_KEYS
};
