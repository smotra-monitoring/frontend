/**
 * Type-safe localStorage wrapper
 * Provides JSON serialization and error handling
 */

export class Storage {
  /**
   * Get item from localStorage with JSON parsing
   */
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage with JSON serialization
   */
  static set<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }

  /**
   * Clear all items from localStorage
   */
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys from localStorage
   */
  static keys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  /**
   * Check if key exists in localStorage
   */
  static has(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  }
}

// Standalone function exports for convenience
export function getItem<T>(key: string, defaultValue?: T): T | null {
  const value = Storage.get<T>(key);
  return value !== null ? value : (defaultValue !== undefined ? defaultValue : null);
}

export function setItem<T>(key: string, value: T): boolean {
  return Storage.set(key, value);
}

export function removeItem(key: string): void {
  Storage.remove(key);
}

export function clear(): void {
  Storage.clear();
}

export function hasItem(key: string): boolean {
  return Storage.has(key);
}
