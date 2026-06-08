/**
 * Refresh Manager
 * 
 * A centralized service to manage a global refresh interval for polling data.
 * It uses the global state management system to notify subscribers about refresh "ticks".
 * 
 * Key Features:
 * - Built on global-state for consistent pub/sub.
 * - Manages a single setInterval timer.
 * - Allows setting the refresh frequency dynamically.
 * - Supports starting and stopping the refresh timer.
 */

import { createState, type Subscriber, type UnsubscribeFn } from '../state/global-state.js';

export type RefreshFrequency = 'off' | 5000 | 15000 | 30000;

interface RefreshState {
  tick: number; // A simple counter that increments on each refresh
  frequency: RefreshFrequency;
}

const initialState: RefreshState = {
  tick: 0,
  frequency: 'off',
};

const refreshState = createState<RefreshState>(initialState);
let refreshInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the refresh timer with the currently set frequency.
 * If the frequency is 'off', it does nothing.
 */
function start(): void {
  stop(); // Ensure no multiple intervals are running
  const { frequency } = refreshState.getState();

  if (typeof frequency === 'number') {
    refreshInterval = setInterval(() => {
      const currentTick = refreshState.getState().tick;
      refreshState.setState({ tick: currentTick + 1 });
    }, frequency);
  }
}

/**
 * Stops the refresh timer.
 */
function stop(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * Sets a new refresh frequency and restarts the timer.
 * If the frequency is 'off', the timer is stopped.
 * 
 * @param newFrequency The new refresh frequency in milliseconds or 'off'.
 */
export function setFrequency(newFrequency: RefreshFrequency): void {
  refreshState.setState({ frequency: newFrequency });
  if (newFrequency === 'off') {
    stop();
  } else {
    start();
  }
}

/**
 * Subscribes a callback function to be executed on every refresh tick.
 * 
 * @param callback The function to call on each tick.
 * @returns An unsubscribe function to clean up the subscription.
 */
export function subscribeToRefresh(callback: Subscriber<RefreshState>): UnsubscribeFn {
  return refreshState.subscribe(callback);
}

/**

 * Gets the current state of the refresh manager.
 * @returns The current refresh state.
 */
export function getRefreshState(): RefreshState {
  return refreshState.getState();
}
