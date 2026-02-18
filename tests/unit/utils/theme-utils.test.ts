/**
 * Tests for theme utilities
 */

import {
  detectSystemTheme,
  applyTheme,
  cycleTheme,
  getThemeIcon,
} from '../../../src/utils/theme-utils.js';
import type { ThemePreference } from '../../../src/types/theme-types.js';
import { mockMatchMedia } from '../../mocks/viewport-mocks.js';

describe('theme-utils', () => {
  beforeEach(() => {
    document.documentElement.className = '';
  });

  describe('detectSystemTheme', () => {
    it('returns dark when system prefers dark', () => {
      mockMatchMedia(true); // matches dark
      expect(detectSystemTheme()).toBe('dark');
    });

    it('returns light when system prefers light', () => {
      mockMatchMedia(false); // does not match dark
      expect(detectSystemTheme()).toBe('light');
    });
  });

  describe('applyTheme', () => {
    it('applies theme-dark class for dark preference', () => {
      applyTheme('dark');
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    });

    it('applies theme-light class for light preference', () => {
      applyTheme('light');
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
      expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    });

    it('applies system-detected theme for system preference', () => {
      mockMatchMedia(true); // system is dark
      applyTheme('system');
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });

    it('removes previous theme class when switching', () => {
      applyTheme('dark');
      applyTheme('light');
      expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    });
  });

  describe('cycleTheme', () => {
    it('cycles system → light → dark → system', () => {
      expect(cycleTheme('system')).toBe('light');
      expect(cycleTheme('light')).toBe('dark');
      expect(cycleTheme('dark')).toBe('system');
    });
  });

  describe('getThemeIcon', () => {
    it('returns correct icon for each theme', () => {
      expect(getThemeIcon('system')).toMatch(/[🖥️💻]/); // Both icons acceptable
      expect(getThemeIcon('light')).toBe('☀️');
      expect(getThemeIcon('dark')).toBe('🌙');
    });
  });
});
