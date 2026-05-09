/**
 * Theme state management with system preference detection
 */

import { createState } from './global-state.js';
import type { ThemeState, ThemePreference, ThemeMode, ThemeChangeEvent } from '../types/theme-types.js';
import { Storage } from '../utils/storage.js';
import {
  getSystemThemePreference,
  watchSystemTheme,
  applyTheme,
  resolveThemeMode,
} from '../utils/theme-utils.js';

const STORAGE_KEY = 'theme';

// Initial theme state
const initialThemeState: ThemeState = {
  preference: 'system',
  currentMode: getSystemThemePreference(),
  systemPreference: getSystemThemePreference(),
};

// Create theme state instance
const themeState = createState<ThemeState>(initialThemeState);

let systemThemeUnwatch: (() => void) | null = null;

/**
 * Initialize theme manager
 * Must be called early in application bootstrap
 */
export function initializeTheme(): void {
  // Load saved preference
  const savedPreference = Storage.get<ThemePreference>(STORAGE_KEY);
  const preference = savedPreference || 'system';

  // Resolve actual mode to apply
  const mode = resolveThemeMode(preference);

  // Update state
  themeState.setState({
    preference,
    currentMode: mode,
    systemPreference: getSystemThemePreference(),
  });

  // Apply theme to DOM
  applyTheme(mode);

  // Watch for system theme changes
  startWatchingSystemTheme();
}

/**
 * Subscribe to theme state changes using internal state management (observer pattern)
 * 
 * Receives the **complete theme state** on every change, including:
 * - preference: user's theme setting (system/light/dark)
 * - currentMode: actual resolved theme mode being applied
 * - systemPreference: detected OS theme preference
 * 
 * **Prefer this method for:**
 * - Internal TypeScript components that need full theme state
 * - Better type safety and direct state access
 * - More efficient subscriptions (no DOM event overhead)
 * - Consistency with other state modules (auth-state, agent-state)
 * 
 * @param callback - Function called with complete theme state on changes
 * @returns Unsubscribe function to remove the listener
 * 
 * @example
 * ```ts
 * const unsubscribe = subscribeToThemeChanges((state) => {
 *   console.log('Theme:', state.currentMode);
 *   console.log('Using system?', state.preference === 'system');
 * });
 * // Later: unsubscribe();
 * ```
 */
export function subscribeToThemeChanges(callback: (state: ThemeState) => void): () => void {
  return themeState.subscribe(callback);
}

/**
 * Set theme preference (system, light, or dark)
 */
export function setTheme(preference: ThemePreference): void {
  // Save preference
  Storage.set(STORAGE_KEY, preference);

  // Resolve mode
  const mode = resolveThemeMode(preference);

  // Update state
  const prevState = themeState.getState();
  themeState.setState({
    preference,
    currentMode: mode,
  });

  // Apply theme
  applyTheme(mode);

  // Notify listeners of change
  notifyThemeChange({
    previous: prevState.currentMode,
    current: mode,
    trigger: 'user',
  });
}

/**
 * Get current theme preference
 */
export function getThemePreference(): ThemePreference {
  return themeState.getState().preference;
}

/**
 * Get complete theme state
 */
export function getTheme(): ThemeState {
  return themeState.getState();
}

/**
 * Get current theme mode (resolved)
 */
export function getCurrentThemeMode(): ThemeMode {
  return themeState.getState().currentMode;
}

/**
 * Toggle between light and dark modes
 * (Switches to explicit light/dark, not system)
 */
export function toggleTheme(): void {
  const current = themeState.getState().currentMode;
  const next: ThemePreference = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

/**
 * Cycle through theme preferences: system → light → dark → system
 */
export function cycleThemePreference(): void {
  const current = themeState.getState().preference;
  let next: ThemePreference;

  switch (current) {
    case 'system':
      next = 'light';
      break;
    case 'light':
      next = 'dark';
      break;
    case 'dark':
      next = 'system';
      break;
    default:
      next = 'system';
  }

  setTheme(next);
}

/**
 * Start watching system theme changes
 */
function startWatchingSystemTheme(): void {
  if (systemThemeUnwatch) {
    return; // Already watching
  }

  systemThemeUnwatch = watchSystemTheme((systemMode: ThemeMode) => {

    // If user is using system preference, update current mode
    const currentState = themeState.getState();
    if (currentState.preference === 'system') {
      setTheme('system'); // This will resolve and apply the new system mode
    } else {
      // Update system preference in state
      themeState.setState({ systemPreference: systemMode });
    }

  });
}

/**
 * Stop watching system theme changes
 */
function stopWatchingSystemTheme(): void {
  if (systemThemeUnwatch) {
    systemThemeUnwatch();
    systemThemeUnwatch = null;
  }
}

/**
 * Notify theme change listeners
 */
function notifyThemeChange(event: ThemeChangeEvent): void {
  // Dispatch custom event for components that need it
  const customEvent = new CustomEvent('themechange', { detail: event });
  window.dispatchEvent(customEvent);
}

/**
 * Subscribe to theme change events using DOM CustomEvent pattern
 * 
 * Receives **theme change events** with transition information:
 * - previous: the theme mode before the change
 * - current: the new theme mode after the change
 * - trigger: what caused the change ('user' or 'system')
 * 
 * **Use this method for:**
 * - Components that only need to react to theme transitions (not full state)
 * - Loose coupling when you don't want to import this module
 * - Integration with vanilla JS or external libraries
 * - Following standard DOM event patterns (bubbling, capturing)
 * - Animations or transitions that need previous/current values
 * 
 * **Note:** For internal components needing full theme state, prefer
 * `subscribeToThemeChanges` for better performance and type safety.
 * 
 * @param callback - Function called with theme change event details
 * @returns Unsubscribe function to remove the event listener
 * 
 * @example
 * ```ts
 * const unsubscribe = onThemeChange((event) => {
 *   console.log(`Theme changed: ${event.previous} → ${event.current}`);
 *   console.log('Triggered by:', event.trigger); // 'user' or 'system'
 * });
 * // Later: unsubscribe();
 * ```
 */
export function onThemeChange(callback: (event: ThemeChangeEvent) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<ThemeChangeEvent>;
    callback(customEvent.detail);
  };

  window.addEventListener('themechange', handler);

  return () => {
    window.removeEventListener('themechange', handler);
  };
}

/**
 * Check if dark mode is active
 */
export function isDarkMode(): boolean {
  return themeState.getState().currentMode === 'dark';
}

/**
 * Check if light mode is active
 */
export function isLightMode(): boolean {
  return themeState.getState().currentMode === 'light';
}

/**
 * Check if using system preference
 */
export function isUsingSystemPreference(): boolean {
  return themeState.getState().preference === 'system';
}
