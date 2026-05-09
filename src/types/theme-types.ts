/**
 * Theme management type definitions
 */

export type ThemePreference = 'system' | 'light' | 'dark';

export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
  preference: ThemePreference;
  currentMode: ThemeMode;
  systemPreference: ThemeMode;
}

export interface ThemeConfig {
  storageKey: string;
  cssClassPrefix: string;
}

export interface ThemeChangeEvent {
  previous: ThemeMode;
  current: ThemeMode;
  trigger: 'user' | 'system';
}
