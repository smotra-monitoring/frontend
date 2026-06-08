/**
 * Tests for refresh-manager service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setFrequency,
  subscribeToRefresh,
  getRefreshState,
  type RefreshFrequency,
} from '../../../src/services/refresh-manager.js';

describe('refresh-manager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset to initial state
    setFrequency('off');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('setFrequency', () => {
    it('updates frequency state', () => {
      setFrequency(5000);
      const state = getRefreshState();
      expect(state.frequency).toBe(5000);
    });

    it('sets frequency to "off"', () => {
      setFrequency('off');
      const state = getRefreshState();
      expect(state.frequency).toBe('off');
    });

    it('starts timer when frequency is set to a number', () => {
      const callback = vi.fn();
      subscribeToRefresh(callback);

      setFrequency(5000);
      
      // Initial state shouldn't trigger callback yet
      expect(callback).toHaveBeenCalledTimes(1); // Called once for setState

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);
      
      // Should have been called again after the interval
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('stops timer when frequency is set to "off"', () => {
      const callback = vi.fn();
      subscribeToRefresh(callback);

      setFrequency(5000);
      vi.advanceTimersByTime(5000);
      
      const callCountBefore = callback.mock.calls.length;
      
      setFrequency('off');
      vi.advanceTimersByTime(5000);
      
      // Should not have been called again after setting to 'off'
      // (only one more call from the setState when setting to 'off')
      expect(callback.mock.calls.length).toBe(callCountBefore + 1);
    });

    it('restarts timer when frequency changes', () => {
      const callback = vi.fn();
      subscribeToRefresh(callback);

      setFrequency(15000);
      vi.advanceTimersByTime(15000);
      
      const callsAfterFirst = callback.mock.calls.length;

      // Change frequency
      setFrequency(5000);
      vi.advanceTimersByTime(5000);
      
      // Should have received ticks at new interval
      expect(callback.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    });
  });

  describe('subscribeToRefresh', () => {
    it('notifies subscribers on each tick', () => {
      const callback = vi.fn();
      subscribeToRefresh(callback);

      setFrequency(5000);
      
      // Advance by 3 intervals
      vi.advanceTimersByTime(5000);
      vi.advanceTimersByTime(5000);
      vi.advanceTimersByTime(5000);
      
      // Should be called for: initial setState, then 3 ticks
      expect(callback.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('increments tick counter on each refresh', () => {
      const callback = vi.fn();
      subscribeToRefresh(callback);

      setFrequency(5000);
      
      const initialTick = getRefreshState().tick;
      
      vi.advanceTimersByTime(5000);
      const afterFirstTick = getRefreshState().tick;
      expect(afterFirstTick).toBe(initialTick + 1);
      
      vi.advanceTimersByTime(5000);
      const afterSecondTick = getRefreshState().tick;
      expect(afterSecondTick).toBe(initialTick + 2);
    });

    it('returns unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToRefresh(callback);

      setFrequency(5000);
      vi.advanceTimersByTime(5000);
      
      const callCountBefore = callback.mock.calls.length;
      
      unsubscribe();
      vi.advanceTimersByTime(5000);
      
      // Should not receive any more calls after unsubscribing
      expect(callback.mock.calls.length).toBe(callCountBefore);
    });

    it('supports multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      subscribeToRefresh(callback1);
      subscribeToRefresh(callback2);

      setFrequency(5000);
      vi.advanceTimersByTime(5000);
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('getRefreshState', () => {
    it('returns current state', () => {
      const state = getRefreshState();
      expect(state).toHaveProperty('tick');
      expect(state).toHaveProperty('frequency');
    });

    it('reflects state changes', () => {
      setFrequency(15000);
      const state = getRefreshState();
      expect(state.frequency).toBe(15000);
    });
  });

  describe('timer management', () => {
    it('prevents multiple intervals running simultaneously', () => {
      const callback = vi.fn();
      subscribeToRefresh(callback);

      setFrequency(5000);
      setFrequency(5000); // Set again
      
      vi.advanceTimersByTime(5000);
      
      // Should only have one interval running
      const callCount = callback.mock.calls.length;
      
      vi.advanceTimersByTime(5000);
      
      // Should increment by roughly the same amount
      expect(callback.mock.calls.length).toBe(callCount + 1);
    });
  });
});
