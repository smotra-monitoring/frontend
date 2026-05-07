/**
 * Viewport state management with responsive breakpoint tracking
 */

import { createState, type Subscriber, type UnsubscribeFn } from './global-state.js';
import type { ViewportState } from '../types/viewport-types.js';
import { getViewportState, watchViewport } from '../utils/viewport-utils.js';

// Create viewport state instance
const viewportState = createState<ViewportState>(getViewportState());

let viewportUnwatch: UnsubscribeFn | null = null;

/**
 * Initialize viewport tracking
 */
export function initializeViewport(): void {
  // Set initial state
  viewportState.setState(getViewportState());

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
 * Subscribe to viewport changes using internal state management (observer pattern)
 * 
 * **Prefer this method for:**
 * - Internal TypeScript components that already import this module
 * - Better type safety and direct state access
 * - More efficient subscriptions (no DOM event overhead)
 * - Consistency with other state modules (auth-state, agent-state)
 * 
 * @param callback - Function called with new viewport state on changes
 * @returns Unsubscribe function to remove the listener
 * 
 * @example
 * ```ts
 * const unsubscribe = subscribeToViewportChanges((state) => {
 *   console.log('Viewport changed:', state.breakpoint);
 * });
 * // Later: unsubscribe();
 * ```
 */
export function subscribeToViewportChanges(callback: Subscriber<ViewportState>): UnsubscribeFn {
  return viewportState.subscribe(callback);
}
