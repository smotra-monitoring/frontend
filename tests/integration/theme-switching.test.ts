/**
 * Integration test for theme switching across app
 */

import {
  initializeTheme,
  setTheme,
  getTheme,
  getThemePreference,
  subscribeToThemeChanges,
} from '../../src/state/theme-manager.js';
import { applyTheme, getNextThemePreference_ForTests, getSystemThemePreference } from '../../src/utils/theme-utils.js';
import { mockMatchMedia } from '../mocks/viewport-mocks.js';

describe('Theme Switching (Integration)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('initializes with system preference on first visit', () => {
    // Simulate system dark mode
    mockMatchMedia(true);

    // Initialize theme system
    initializeTheme();

    // Should detect and apply system theme
    const theme = getTheme();
    expect(theme.preference).toBe('system');
    expect(theme.currentMode).toBe('dark');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
  });

  it('persists user theme preference across sessions', () => {
    // User selects dark theme
    setTheme('dark');

    // Verify immediate application
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(getThemePreference()).toBe('dark');

    // Simulate page reload
    document.documentElement.className = '';

    // Re-initialize
    initializeTheme();

    // Theme should be restored from localStorage
    expect(getThemePreference()).toBe('dark');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
  });

  it('cycles through theme preferences', () => {
    setTheme('system');
    expect(getThemePreference()).toBe('system');

    // Cycle to light
    const nextTheme1 = getNextThemePreference_ForTests(getThemePreference());
    setTheme(nextTheme1);
    expect(getThemePreference()).toBe('light');
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);

    // Cycle to dark
    const nextTheme2 = getNextThemePreference_ForTests(getThemePreference());
    setTheme(nextTheme2);
    expect(getThemePreference()).toBe('dark');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);

    // Cycle back to system
    const nextTheme3 = getNextThemePreference_ForTests(getThemePreference());
    setTheme(nextTheme3);
    expect(getThemePreference()).toBe('system');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
  });

  it('updates when system preference changes (while on system mode)', () => {
    let mediaQueryList = mockMatchMedia(false); // Start with light
    setTheme('system');

    expect(document.documentElement.classList.contains('theme-light')).toBe(true);

    // Simulate system theme change to dark
    mediaQueryList = mockMatchMedia(true);
    setTheme('system');

    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
  });

  it('does not update when system changes but user has manual preference', () => {
    // User explicitly chooses light
    setTheme('light');
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);

    // System changes to dark
    mockMatchMedia(true);
    initializeTheme(); // Re-initialize

    // Should still be light (user preference overrides)
    expect(getThemePreference()).toBe('light');
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
  });

  it('notifies all subscribers when theme changes', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    subscribeToThemeChanges(callback1);
    subscribeToThemeChanges(callback2);

    setTheme('dark');

    expect(callback1).toHaveBeenCalledWith(
      expect.objectContaining({ preference: 'dark' })
    );
    expect(callback2).toHaveBeenCalledWith(
      expect.objectContaining({ preference: 'dark' })
    );
  });

  it('handles rapid theme changes correctly', () => {
    setTheme('light');
    setTheme('dark');
    setTheme('system');
    setTheme('light');

    // Final state should be light
    expect(getThemePreference()).toBe('light');
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);

    // Should not have multiple theme classes
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
  });

  it('applies correct theme class immediately without FOUC', () => {
    // Store preference
    localStorage.setItem('theme', JSON.stringify('light'));

    // Simulate script execution before page render
    initializeTheme();

    // Theme class should be applied immediately
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
  });
});
