import { STORAGE_KEYS } from '../constants';

// Generic localStorage utilities with type safety
export class Storage {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to parse localStorage item "${key}":`, error);
      return defaultValue;
    }
  }

  static set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save to localStorage "${key}":`, error);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove from localStorage "${key}":`, error);
    }
  }

  static clear(): void {
    try {
      // Only clear our app's keys
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}

// Specific storage utilities
export const ProviderStorage = {
  get: () => Storage.get(STORAGE_KEYS.PROVIDER_SETTINGS, null),
  set: (settings: any) => Storage.set(STORAGE_KEYS.PROVIDER_SETTINGS, settings),
  clear: () => Storage.remove(STORAGE_KEYS.PROVIDER_SETTINGS),
};

export const PreferencesStorage = {
  get: () => Storage.get(STORAGE_KEYS.USER_PREFERENCES, {}),
  set: (preferences: any) => Storage.set(STORAGE_KEYS.USER_PREFERENCES, preferences),
  clear: () => Storage.remove(STORAGE_KEYS.USER_PREFERENCES),
}; 