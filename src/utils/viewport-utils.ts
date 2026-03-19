/**
 * Viewport detection and responsive utilities
 */

import type { Breakpoint, BreakpointName, ViewportState } from '../types/viewport-types.js';
import { BREAKPOINTS } from '../types/viewport-types.js';

/**
 * Get complete viewport state
 */
export function getViewportState(): ViewportState {
  const { width, height } = getViewportDimensions();
  const breakpoint = getBreakpointName(width);
  const orientation = getOrientation();
  const devicePixelRatio = window.devicePixelRatio || 1;
  const optimalColumns = getOptimalColumns(width);

  return {
    width,
    height,
    breakpoint,
    orientation,
    devicePixelRatio,
    optimalColumns,
  };
}

/**
 * Watch for viewport changes with debouncing
 */
export function watchViewport(
  callback: (state: ViewportState) => void,
  debounceMs: number = 150
): () => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const handler = () => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      callback(getViewportState());
    }, debounceMs);
  };

  window.addEventListener('resize', handler);
  window.addEventListener('orientationchange', handler);

  // Initial call
  callback(getViewportState());

  return () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    window.removeEventListener('resize', handler);
    window.removeEventListener('orientationchange', handler);
  };
}

/**
 * Get current viewport dimensions
 */
function getViewportDimensions(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Detect current breakpoint based on viewport width
 */
function getBreakpoint(width: number = window.innerWidth): Breakpoint {
  for (const breakpoint of BREAKPOINTS) {
    if (width >= breakpoint.minWidth && width <= breakpoint.maxWidth) {
      return breakpoint;
    }
  }

  return BREAKPOINTS[0] as Breakpoint; // Default to mobile if no match
}


export function getBreakpointName(width: number = window.innerWidth): BreakpointName {
  return getBreakpoint(width).name;
}

/**
 * Calculate optimal column count for current viewport
 */
export function getOptimalColumns(width: number = window.innerWidth): number {
  const breakpoint = getBreakpoint(width);

  // For auto-fit grid with 300px min card width
  const minCardWidth = 300;
  const gap = 24; // 1.5rem in pixels
  const padding = breakpoint.name === 'mobile' ? 16 : (breakpoint.name === 'tablet' ? 16 : 48);

  // Available width for cards (subtract sidebar on desktop+)
  const sidebarWidth = breakpoint.name === 'desktop' || breakpoint.name === 'wide' || breakpoint.name === 'ultrawide' ? 200 : 0;
  const availableWidth = width - sidebarWidth - (padding * 2);

  // Calculate how many cards can fit
  const columns = Math.floor((availableWidth + gap) / (minCardWidth + gap));

  // Clamp to breakpoint's min/max
  return Math.max(breakpoint.columns.min, Math.min(columns, breakpoint.columns.max));
}

/**
 * Get current device orientation
 */
export function getOrientation(): 'portrait' | 'landscape' {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Check if mobile viewport
 */
export function isMobile(width: number = window.innerWidth): boolean {
  return width < 768;
}

/**
 * Check if tablet viewport
 */
export function isTablet(width: number = window.innerWidth): boolean {
  return width >= 768 && width < 1024;
}

/**
 * Check if desktop viewport
 */
export function isDesktop(width: number = window.innerWidth): boolean {
  return width >= 1024;
}

/**
 * Check if wide desktop viewport
 */
export function isWide(width: number = window.innerWidth): boolean {
  return width >= 1440;
}

/**
 * Check if ultra-wide viewport
 */
export function isUltraWide(width: number = window.innerWidth): boolean {
  return width >= 1920;
}

/**
 * Check if touch device
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - legacy property
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get minimum touch target size
 */
export function getMinTouchTargetSize(): number {
  return isTouchDevice() ? 44 : 32;
}

/**
 * Check if viewport height is reduced (browser chrome visible on mobile)
 */
export function isReducedViewportHeight(): boolean {
  // On mobile, if actual height is significantly less than screen height,
  // browser chrome is likely visible
  return isMobile() && window.innerHeight < window.screen.height * 0.85;
}
