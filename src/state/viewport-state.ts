/**
 * Viewport state management with responsive breakpoint tracking
 */

import { createState } from './global-state.js';
import type { ViewportState } from '../types/viewport-types.js';
import { getViewportState, watchViewport } from '../utils/viewport-utils.js';

// Create viewport state instance
export const viewportState = createState<ViewportState>(getViewportState());

let viewportUnwatch: (() => void) | null = null;

/**
 * Initialize viewport tracking
 */
export function initializeViewport(): void {
  // Set initial state
  const state = getViewportState();
  viewportState.setState(state);

  // Start watching for changes
  startWatchingViewport();
}

/**
 * Start watching viewport changes
 */
function startWatchingViewport(): void {
  if (viewportUnwatch) {
    return; // Already watching
  }

  viewportUnwatch = watchViewport((state: ViewportState) => {
    viewportState.setState(state);

    // Dispatch custom event for components
    const customEvent = new CustomEvent('viewportchange', { detail: state });
    window.dispatchEvent(customEvent);
  }, 150); // 150ms debounce
}

/**
 * Stop watching viewport changes
 */
function stopWatchingViewport(): void {
  if (viewportUnwatch) {
    viewportUnwatch();
    viewportUnwatch = null;
  }
}

/**
 * Subscribe to viewport changes
 */
export function subscribeToViewportChanges(callback: (state: ViewportState) => void): () => void {
  return viewportState.subscribe(callback);
}

/**
 * Get current viewport state
 */
export function getCurrentViewportState(): ViewportState {
  return viewportState.getState();
}

/**
 * Subscribe to viewport changes
 */
export function onViewportChange(callback: (state: ViewportState) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<ViewportState>;
    callback(customEvent.detail);
  };

  window.addEventListener('viewportchange', handler);

  return () => {
    window.removeEventListener('viewportchange', handler);
  };
}

/**
 * Check if current viewport is mobile
 */
export function isCurrentlyMobile(): boolean {
  return viewportState.getState().breakpoint === 'mobile';
}

/**
 * Check if current viewport is tablet
 */
export function isCurrentlyTablet(): boolean {
  return viewportState.getState().breakpoint === 'tablet';
}

/**
 * Check if current viewport is desktop or larger
 */
export function isCurrentlyDesktop(): boolean {
  const bp = viewportState.getState().breakpoint;
  return bp === 'desktop' || bp === 'wide' || bp === 'ultrawide';
}

/**
 * Check if current viewport is wide desktop
 */
export function isCurrentlyWide(): boolean {
  const bp = viewportState.getState().breakpoint;
  return bp === 'wide' || bp === 'ultrawide';
}

/**
 * Check if current viewport is ultra-wide
 */
export function isCurrentlyUltraWide(): boolean {
  return viewportState.getState().breakpoint === 'ultrawide';
}

/**
 * Get optimal column count for current viewport
 */
export function getCurrentOptimalColumns(): number {
  return viewportState.getState().optimalColumns;
}

/**
 * Check if in portrait orientation
 */
export function isPortrait(): boolean {
  return viewportState.getState().orientation === 'portrait';
}

/**
 * Check if in landscape orientation
 */
export function isLandscape(): boolean {
  return viewportState.getState().orientation === 'landscape';
}
