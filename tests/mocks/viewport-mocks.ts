/**
 * Mock viewport utilities for testing responsive behavior
 */

import type { ViewportBreakpoint } from '../../src/types/viewport-types.js';

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  dispatchEvent: jest.Mock;
}

export function mockViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
}

export function mockMatchMedia(matches: boolean): MockMediaQueryList {
  const mediaQueryList: MockMediaQueryList = {
    matches,
    media: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };

  window.matchMedia = jest.fn(() => mediaQueryList as any);
  return mediaQueryList;
}

export function getComputedColumns(element: HTMLElement): number {
  const gridTemplate = window.getComputedStyle(element).gridTemplateColumns;
  if (!gridTemplate || gridTemplate === 'none') {
    return 1;
  }
  return gridTemplate.split(' ').length;
}

export const viewportBreakpoints = {
  mobile: { width: 375, height: 667, breakpoint: 'mobile' as ViewportBreakpoint },
  tablet: { width: 768, height: 1024, breakpoint: 'tablet' as ViewportBreakpoint },
  desktop: { width: 1280, height: 800, breakpoint: 'desktop' as ViewportBreakpoint },
  wide: { width: 1680, height: 1050, breakpoint: 'wide' as ViewportBreakpoint },
  ultrawide: { width: 2560, height: 1440, breakpoint: 'ultrawide' as ViewportBreakpoint },
};

export function mockBreakpoint(breakpoint: ViewportBreakpoint): void {
  const viewport = viewportBreakpoints[breakpoint];
  mockViewport(viewport.width, viewport.height);
}
