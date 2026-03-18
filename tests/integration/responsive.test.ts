/**
 * Integration test for responsive dashboard behavior
 */

import { getBreakpointName, getOptimalColumns, isMobile, isTablet, isDesktop } from '../../src/utils/viewport-utils.js';
import { mockViewport, viewportBreakpoints, getComputedColumns } from '../mocks/viewport-mocks.js';

describe('Responsive Dashboard (Integration)', () => {
  describe('Mobile viewport (375px)', () => {
    beforeEach(() => {
      mockViewport(viewportBreakpoints.mobile.width, viewportBreakpoints.mobile.height);
    });

    it('detects mobile breakpoint', () => {
      expect(getBreakpointName()).toBe('mobile');
      expect(isMobile()).toBe(true);
      expect(isTablet()).toBe(false);
      expect(isDesktop()).toBe(false);
    });

    it('recommends 1 column layout', () => {
      expect(getOptimalColumns()).toBe(1);
    });

    it('renders dashboard grid in single column', () => {
      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = `repeat(${getOptimalColumns()}, 1fr)`;

      document.body.appendChild(grid);

      const cols = getComputedColumns(grid);
      expect(cols).toBe(1);

      document.body.removeChild(grid);
    });
  });

  describe('Tablet viewport (768px)', () => {
    beforeEach(() => {
      mockViewport(viewportBreakpoints.tablet.width, viewportBreakpoints.tablet.height);
    });

    it('detects tablet breakpoint', () => {
      expect(getBreakpointName()).toBe('tablet');
      expect(isMobile()).toBe(false);
      expect(isTablet()).toBe(true);
      expect(isDesktop()).toBe(false);
    });

    it('recommends 2 column layout', () => {
      expect(getOptimalColumns()).toBe(2);
    });
  });

  describe('Desktop viewport (1280px)', () => {
    beforeEach(() => {
      mockViewport(viewportBreakpoints.desktop.width, viewportBreakpoints.desktop.height);
    });

    it('detects desktop breakpoint', () => {
      expect(getBreakpointName()).toBe('desktop');
      expect(isMobile()).toBe(false);
      expect(isTablet()).toBe(false);
      expect(isDesktop()).toBe(true);
    });

    it('recommends 3-4 columns', () => {
      const cols = getOptimalColumns();
      expect(cols).toBeGreaterThanOrEqual(3);
      expect(cols).toBeLessThanOrEqual(4);
    });
  });

  describe('Wide viewport (1680px)', () => {
    beforeEach(() => {
      mockViewport(viewportBreakpoints.wide.width, viewportBreakpoints.wide.height);
    });

    it('detects wide breakpoint', () => {
      expect(getBreakpointName()).toBe('wide');
      expect(isDesktop()).toBe(true);
    });

    it('recommends 4-5 columns', () => {
      const cols = getOptimalColumns();
      expect(cols).toBeGreaterThanOrEqual(4);
      expect(cols).toBeLessThanOrEqual(5);
    });
  });

  describe('Ultra-wide viewport (2560px)', () => {
    beforeEach(() => {
      mockViewport(viewportBreakpoints.ultrawide.width, viewportBreakpoints.ultrawide.height);
    });

    it('detects ultrawide breakpoint', () => {
      expect(getBreakpointName()).toBe('ultrawide');
      expect(isDesktop()).toBe(true);
    });

    it('recommends 5-6+ columns', () => {
      const cols = getOptimalColumns();
      expect(cols).toBeGreaterThanOrEqual(5);
      expect(cols).toBeLessThanOrEqual(6);
    });
  });

  describe('Responsive transitions', () => {
    it('updates layout when resizing from mobile to desktop', () => {
      // Start mobile
      mockViewport(375, 667);
      expect(getBreakpointName()).toBe('mobile');
      expect(getOptimalColumns()).toBe(1);

      // Resize to desktop
      mockViewport(1280, 800);
      expect(getBreakpointName()).toBe('desktop');
      const cols = getOptimalColumns();
      expect(cols).toBeGreaterThanOrEqual(3);
    });

    it('updates layout when resizing from desktop to mobile', () => {
      // Start desktop
      mockViewport(1280, 800);
      expect(getBreakpointName()).toBe('desktop');

      // Resize to mobile
      mockViewport(375, 667);
      expect(getBreakpointName()).toBe('mobile');
      expect(getOptimalColumns()).toBe(1);
    });

    it('handles intermediate tablet size', () => {
      // Mobile
      mockViewport(767, 600);
      expect(getBreakpointName()).toBe('mobile');

      // Cross tablet threshold
      mockViewport(768, 600);
      expect(getBreakpointName()).toBe('tablet');
      expect(getOptimalColumns()).toBe(2);

      // Desktop
      mockViewport(1024, 768);
      expect(getBreakpointName()).toBe('desktop');
      expect(getOptimalColumns()).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Full-width utilization', () => {
    it('uses full width on desktop (no max-width)', () => {
      mockViewport(1920, 1080);

      const mainContent = document.createElement('div');
      mainContent.style.width = '100%';
      mainContent.style.maxWidth = 'none'; // Should not constrain width

      document.body.appendChild(mainContent);

      // Width calculation: 100vw - sidebar (200px)
      const expectedWidth = window.innerWidth - 200;
      const actualWidth = mainContent.offsetWidth;

      // Allow some tolerance for browser rendering
      expect(Math.abs(actualWidth - expectedWidth)).toBeLessThan(10);

      document.body.removeChild(mainContent);
    });

    it('uses full available width on ultra-wide', () => {
      mockViewport(2560, 1440);

      // Dashboard should scale to fill available space
      const cols = getOptimalColumns();
      expect(cols).toBeGreaterThanOrEqual(5);

      // No artificial max-width should limit columns
      expect(cols).not.toBe(3); // Should not be capped at desktop columns
    });
  });
});
