/**
 * Tests for theme state management
 */

import {
  getTheme,
  getThemePreference,
  setTheme,
  subscribeToThemeChanges,
  initializeTheme,
} from '../../../src/state/theme-manager.js';
import { mockMatchMedia } from '../../mocks/viewport-mocks.js';

describe('theme-manager', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  describe('getTheme', () => {
    it('returns current theme state', () => {
      const theme = getTheme();
      expect(theme).toBeDefined();
      expect(theme.preference).toBeDefined();
      expect(theme.currentMode).toBeDefined();
    });
  });

  describe('getThemePreference', () => {
    it('returns system preference by default', () => {
      expect(getThemePreference()).toBe('system');
    });

    it('returns stored preference', () => {
      setTheme('dark');
      expect(getThemePreference()).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('updates theme preference', () => {
      setTheme('dark');
      expect(getThemePreference()).toBe('dark');
    });

    it('applies theme to document', () => {
      setTheme('dark');
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });

    it('stores preference in localStorage', () => {
      setTheme('light');
      const stored = localStorage.getItem('theme');
      expect(JSON.parse(stored!)).toBe('light');
    });

    it('handles system preference', () => {
      mockMatchMedia(true); // system is dark
      setTheme('system');

      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });

    it('notifies subscribers on theme change', async () => {
      const unsubscribe = subscribeToThemeChanges((state) => {
        expect(state.preference).toBe('dark');
        unsubscribe();
      });

      setTheme('dark');
    });
  });

  describe('subscribeToThemeChanges', () => {
    it('notifies on theme changes', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToThemeChanges(callback);

      setTheme('dark');
      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });

    it('can unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToThemeChanges(callback);

      unsubscribe();
      setTheme('light');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('initializeTheme', () => {
    it('initializes with stored preference', () => {
      localStorage.setItem('theme', JSON.stringify('dark'));
      document.documentElement.className = '';

      initializeTheme();

      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });

    it('initializes with system preference when no preference stored', () => {
      mockMatchMedia(false); // light

      initializeTheme();

      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    });
  });
});
