// Custom storage adapter for Supabase that uses Capacitor Preferences (native storage)
// This ensures session persistence survives app close/restart on Android
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

/**
 * CapacitorStorage - A custom storage adapter for Supabase Auth
 * 
 * Why this is needed:
 * - `window.localStorage` does NOT persist reliably in Capacitor Android WebViews
 * - When the app is closed (not just backgrounded), localStorage may be cleared
 * - This adapter uses native Android SharedPreferences via @capacitor/preferences
 * - Native storage persists across app closes, device restarts, and updates
 * 
 * Usage:
 * ```typescript
 * import { capacitorStorage } from './capacitorStorage';
 * 
 * const supabase = createClient(url, key, {
 *   auth: {
 *     storage: capacitorStorage,
 *     persistSession: true,
 *   }
 * });
 * ```
 */

// Storage key prefix to avoid conflicts with other Capacitor apps
const STORAGE_PREFIX = 'supabase_auth_';

/**
 * Custom storage adapter implementing Supabase's SupportedStorage interface
 * Uses native Capacitor Preferences on mobile, falls back to localStorage on web
 */
export const capacitorStorage = {
    /**
     * Get an item from storage
     */
    async getItem(key: string): Promise<string | null> {
        try {
            if (Capacitor.isNativePlatform()) {
                const { value } = await Preferences.get({ key: STORAGE_PREFIX + key });
                console.log(`[CapacitorStorage] getItem(${key}): ${value ? 'found' : 'null'}`);
                return value;
            }
            // Fallback to localStorage for web
            return localStorage.getItem(key);
        } catch (error) {
            console.error(`[CapacitorStorage] Error getting item ${key}:`, error);
            // Fallback to localStorage if Preferences fails
            try {
                return localStorage.getItem(key);
            } catch {
                return null;
            }
        }
    },

    /**
     * Set an item in storage
     */
    async setItem(key: string, value: string): Promise<void> {
        try {
            if (Capacitor.isNativePlatform()) {
                await Preferences.set({ key: STORAGE_PREFIX + key, value });
                console.log(`[CapacitorStorage] setItem(${key}): success`);
            }
            // Always also set in localStorage for redundancy
            try {
                localStorage.setItem(key, value);
            } catch {
                // localStorage may not be available
            }
        } catch (error) {
            console.error(`[CapacitorStorage] Error setting item ${key}:`, error);
            // Fallback to localStorage if Preferences fails
            try {
                localStorage.setItem(key, value);
            } catch {
                // Ignore localStorage errors
            }
        }
    },

    /**
     * Remove an item from storage
     */
    async removeItem(key: string): Promise<void> {
        try {
            if (Capacitor.isNativePlatform()) {
                await Preferences.remove({ key: STORAGE_PREFIX + key });
                console.log(`[CapacitorStorage] removeItem(${key}): success`);
            }
            // Always also remove from localStorage
            try {
                localStorage.removeItem(key);
            } catch {
                // localStorage may not be available
            }
        } catch (error) {
            console.error(`[CapacitorStorage] Error removing item ${key}:`, error);
            // Fallback to localStorage if Preferences fails
            try {
                localStorage.removeItem(key);
            } catch {
                // Ignore localStorage errors
            }
        }
    },
};

/**
 * Helper function to migrate existing localStorage session to Capacitor Preferences
 * Call this once on app startup to migrate any existing sessions
 */
export async function migrateSessionFromLocalStorage(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
        return; // Only needed on native platforms
    }

    try {
        // Check if we already have a session in Preferences
        const { value: existingSession } = await Preferences.get({
            key: STORAGE_PREFIX + 'sb-mtdngnyatbiipyumqmdd-auth-token'
        });

        if (existingSession) {
            console.log('[CapacitorStorage] Session already exists in Preferences, skipping migration');
            return;
        }

        // Try to get session from localStorage
        const localSession = localStorage.getItem('sb-mtdngnyatbiipyumqmdd-auth-token');

        if (localSession) {
            // Migrate to Preferences
            await Preferences.set({
                key: STORAGE_PREFIX + 'sb-mtdngnyatbiipyumqmdd-auth-token',
                value: localSession
            });
            console.log('[CapacitorStorage] Successfully migrated session from localStorage to Preferences');
        }
    } catch (error) {
        console.warn('[CapacitorStorage] Error during session migration:', error);
    }
}

export default capacitorStorage;
