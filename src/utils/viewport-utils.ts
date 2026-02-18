/**
 * Viewport detection and responsive utilities
 */

import type { BreakpointName, ViewportState, BREAKPOINTS } from '../types/viewport-types.js';

// Import breakpoints definition
const BREAKPOINTS_DATA = [
  {
    name: 'mobile' as const,
    minWidth: 0,
    maxWidth: 767,
    columns: { min: 1, max: 1 }
  },
  {
    name: 'tablet' as const,
    minWidth: 768,
    maxWidth: 1023,
    columns: { min: 2, max: 2 }
  },
  {
    name: 'desktop' as const,
    minWidth: 1024,
    maxWidth: 1439,
    columns: { min: 3, max: 4 }
  },
  {
    name: 'wide' as const,
    minWidth: 1440,
    maxWidth: 1919,
    columns: { min: 4, max: 5 }
  },
  {
    name: 'ultrawide' as const,
    minWidth: 1920,
    columns: { min: 5, max: 6 }
  }
];

/**
 * Get current viewport dimensions
 */
export function getViewportDimensions(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Detect current breakpoint based on viewport width
 */
export function getCurrentBreakpoint(width: number = window.innerWidth): BreakpointName {
  for (const breakpoint of BREAKPOINTS_DATA) {
    if (breakpoint.maxWidth !== undefined) {
      if (width >= breakpoint.minWidth && width <= breakpoint.maxWidth) {
        return breakpoint.name;
      }
    } else {
      if (width >= breakpoint.minWidth) {
        return breakpoint.name;
      }
    }
  }
  
  return 'mobile';
}

/**
 * Alias for getCurrentBreakpoint
 */
export const getBreakpoint = getCurrentBreakpoint;

/**
 * Calculate optimal column count for current viewport
 */
export function getOptimalColumns(width: number = window.innerWidth): number {
  const breakpoint = BREAKPOINTS_DATA.find(bp => {
    if (bp.maxWidth !== undefined) {
      return width >= bp.minWidth && width <= bp.maxWidth;
    }
    return width >= bp.minWidth;
  });
  
  if (!breakpoint) {
    return 1;
  }
  
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
 * Check if viewport matches breakpoint
 */
export function isBreakpoint(name: BreakpointName, width: number = window.innerWidth): boolean {
  return getCurrentBreakpoint(width) === name;
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
 * Get complete viewport state
 */
export function getViewportState(): ViewportState {
  const { width, height } = getViewportDimensions();
  const breakpoint = getCurrentBreakpoint(width);
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
