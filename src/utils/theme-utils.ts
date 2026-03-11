/**
 * Theme detection and management utilities
 */

import type { ThemeMode, ThemePreference } from '../types/theme-types.js';

/**
 * Detect system color scheme preference
 */
export function getSystemThemePreference(): ThemeMode {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/**
 * Alias for getSystemThemePreference
 */
export const getSystemThemePreference_ForTests = getSystemThemePreference;

/**
 * Listen for system theme changes
 */
export function watchSystemTheme(callback: (theme: ThemeMode) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  // Legacy browsers
  else if (mediaQuery.addListener) {
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }

  return () => { };
}

/**
 * Apply theme to document
 */
export function applyTheme(mode: ThemeMode | ThemePreference): void {
  const html = document.documentElement;

  // Resolve 'system' preference to actual mode
  const resolvedMode: ThemeMode = mode === 'system' ? getSystemThemePreference() : mode as ThemeMode;

  // Remove both theme classes first
  html.classList.remove('theme-light', 'theme-dark');

  // Add the current theme class
  html.classList.add(`theme-${resolvedMode}`);

  // Update meta theme-color for mobile browsers
  updateMetaThemeColor(resolvedMode);
}

/**
 * Update meta theme-color based on current theme
 */
function updateMetaThemeColor(mode: ThemeMode): void {
  let metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    document.head.appendChild(metaThemeColor);
  }

  // Set appropriate color based on theme
  metaThemeColor.content = mode === 'dark' ? '#0b0e14' : '#ffffff';
}

/**
 * Resolve theme mode from preference
 */
export function resolveThemeMode(preference: ThemePreference): ThemeMode {
  if (preference === 'system') {
    return getSystemThemePreference();
  }
  return preference;
}

/**
 * Get current theme class from document
 */
export function getCurrentThemeClass(): ThemeMode | null {
  const html = document.documentElement;

  if (html.classList.contains('theme-dark')) {
    return 'dark';
  }
  if (html.classList.contains('theme-light')) {
    return 'light';
  }

  return null;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Get theme icon name based on preference
 */
export function getThemeIcon(preference: ThemePreference): string {
  switch (preference) {
    case 'light':
      return '☀️';
    case 'dark':
      return '🌙';
    case 'system':
      return '💻';
    default:
      return '💻';
  }
}

/**
 * Cycle through theme preferences
 */
export function getNextThemePreference(current: ThemePreference): ThemePreference {
  const cycle: ThemePreference[] = ['system', 'light', 'dark'];
  const currentIndex = cycle.indexOf(current);
  const nextIndex = (currentIndex + 1) % cycle.length;
  return cycle[nextIndex] as ThemePreference;
}

/**
 * Alias for getNextThemePreference
 */
export const getNextThemePreference_ForTests = getNextThemePreference;
