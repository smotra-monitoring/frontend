/**
 * Tests for viewport utilities
 */

import {
  getCurrentBreakpoint,
  isMobile,
  isTablet,
  isDesktop,
  getOptimalColumns,
} from '../../../src/utils/viewport-utils.js';
import { mockViewport } from '../../mocks/viewport-mocks.js';

describe('viewport-utils', () => {
  describe('getBreakpoint', () => {
    it('returns mobile for width < 768', () => {
      mockViewport(375, 667);
      expect(getCurrentBreakpoint()).toBe('mobile');

      mockViewport(767, 600);
      expect(getCurrentBreakpoint()).toBe('mobile');
    });

    it('returns tablet for width 768-1023', () => {
      mockViewport(768, 1024);
      expect(getCurrentBreakpoint()).toBe('tablet');

      mockViewport(1023, 800);
      expect(getCurrentBreakpoint()).toBe('tablet');
    });

    it('returns desktop for width 1024-1439', () => {
      mockViewport(1024, 768);
      expect(getCurrentBreakpoint()).toBe('desktop');

      mockViewport(1439, 900);
      expect(getCurrentBreakpoint()).toBe('desktop');
    });

    it('returns wide for width 1440-1919', () => {
      mockViewport(1440, 900);
      expect(getCurrentBreakpoint()).toBe('wide');

      mockViewport(1919, 1080);
      expect(getCurrentBreakpoint()).toBe('wide');
    });

    it('returns ultrawide for width >= 1920', () => {
      mockViewport(1920, 1080);
      expect(getCurrentBreakpoint()).toBe('ultrawide');

      mockViewport(2560, 1440);
      expect(getCurrentBreakpoint()).toBe('ultrawide');

      mockViewport(3840, 2160);
      expect(getCurrentBreakpoint()).toBe('ultrawide');
    });
  });

  describe('isMobile', () => {
    it('returns true for mobile viewport', () => {
      mockViewport(375, 667);
      expect(isMobile()).toBe(true);
    });

    it('returns false for tablet and larger', () => {
      mockViewport(768, 1024);
      expect(isMobile()).toBe(false);

      mockViewport(1280, 800);
      expect(isMobile()).toBe(false);
    });
  });

  describe('isTablet', () => {
    it('returns true for tablet viewport', () => {
      mockViewport(768, 1024);
      expect(isTablet()).toBe(true);
    });

    it('returns false for mobile and desktop', () => {
      mockViewport(375, 667);
      expect(isTablet()).toBe(false);

      mockViewport(1024, 768);
      expect(isTablet()).toBe(false);
    });
  });

  describe('isDesktop', () => {
    it('returns true for desktop viewports and larger', () => {
      mockViewport(1024, 768);
      expect(isDesktop()).toBe(true);

      mockViewport(1440, 900);
      expect(isDesktop()).toBe(true);

      mockViewport(1920, 1080);
      expect(isDesktop()).toBe(true);
    });

    it('returns false for mobile and tablet', () => {
      mockViewport(375, 667);
      expect(isDesktop()).toBe(false);

      mockViewport(768, 1024);
      expect(isDesktop()).toBe(false);
    });
  });

  describe('getOptimalColumns', () => {
    it('returns 1 column for mobile', () => {
      mockViewport(375, 667);
      expect(getOptimalColumns()).toBe(1);
    });

    it('returns 2 columns for tablet', () => {
      mockViewport(768, 1024);
      expect(getOptimalColumns()).toBe(2);
    });

    it('returns 3-4 columns for desktop', () => {
      mockViewport(1280, 800);
      const cols = getOptimalColumns();
      expect(cols).toBeGreaterThanOrEqual(3);
      expect(cols).toBeLessThanOrEqual(4);
    });

    it('returns 4-5 columns for wide', () => {
      mockViewport(1680, 1050);
      const cols = getOptimalColumns();
      expect(cols).toBeGreaterThanOrEqual(4);
      expect(cols).toBeLessThanOrEqual(5);
    });

    it('returns 5-6 columns for ultrawide', () => {
      mockViewport(2560, 1440);
      const cols = getOptimalColumns();
      expect(cols).toBeGreaterThanOrEqual(5);
      expect(cols).toBeLessThanOrEqual(6);
    });

    it('respects minimum column width', () => {
      mockViewport(400, 600); // Very narrow
      const cols = getOptimalColumns(300); // min 300px per column
      expect(cols).toBe(1);
    });
  });
});
