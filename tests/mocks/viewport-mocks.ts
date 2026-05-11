/**
 * Mock viewport utilities for testing responsive behavior
 */
import { vi } from 'vitest';

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: vi.Mock;
  removeEventListener: vi.Mock;
  dispatchEvent: vi.Mock;
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
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  window.matchMedia = vi.fn(() => mediaQueryList as any);
  return mediaQueryList;
}

export function getComputedColumns(element: HTMLElement): number {
  const gridTemplate = window.getComputedStyle(element).gridTemplateColumns;
  if (!gridTemplate || gridTemplate === 'none') {
    return 1;
  }

  // Handle jsdom/shorthand syntax: repeat(X, ...)
  const repeatMatch = gridTemplate.match(/repeat\((\d+),/);
  if (repeatMatch) {
    return parseInt(repeatMatch[1], 10);
  }

  return gridTemplate.split(' ').length;
}
