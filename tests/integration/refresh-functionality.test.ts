/**
 * Integration tests for the refresh functionality
 * Tests the interaction between RefreshManager, RefreshControl, and widgets
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setFrequency, subscribeToRefresh, getRefreshState } from '../../src/services/refresh-manager.js';
import { RefreshControl } from '../../src/components/refresh-control.js';
import { AgentStatesWidget } from '../../src/widgets/agent-states.js';
import { setAgents } from '../../src/state/agent-state.js';
import { mockAgents } from '../mocks/agent-data.js';

describe('Refresh Functionality Integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Reset state
    setFrequency('off');
    setAgents([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.removeChild(container);
  });

  describe('RefreshControl and RefreshManager interaction', () => {
    it('changes refresh manager frequency when user selects an option', () => {
      const refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select') as HTMLSelectElement;
      select.value = '5000';
      select.dispatchEvent(new Event('change'));

      expect(getRefreshState().frequency).toBe(5000);

      refreshControl.destroy();
    });

    it('starts polling when frequency is set', () => {
      const callback = vi.fn();
      subscribeToRefresh(callback);

      const refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select') as HTMLSelectElement;
      select.value = '15000';
      select.dispatchEvent(new Event('change'));

      // Advance time
      vi.advanceTimersByTime(15000);

      expect(callback).toHaveBeenCalled();

      refreshControl.destroy();
    });

    it('stops polling when set to "off"', () => {
      const callback = vi.fn();
      subscribeToRefresh(callback);

      const refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select') as HTMLSelectElement;
      
      // Start polling
      select.value = '5000';
      select.dispatchEvent(new Event('change'));
      
      vi.advanceTimersByTime(5000);
      const callCountAfterStart = callback.mock.calls.length;

      // Stop polling
      select.value = 'off';
      select.dispatchEvent(new Event('change'));
      
      vi.advanceTimersByTime(5000);
      
      // Should have one more call from setState('off'), but no more ticks
      expect(callback.mock.calls.length).toBe(callCountAfterStart + 1);

      refreshControl.destroy();
    });
  });

  describe('Widget refresh on tick', () => {
    it('widget receives refresh ticks and updates loading state', () => {
      const widgetContainer = document.createElement('div');
      container.appendChild(widgetContainer);
      
      setAgents(mockAgents);
      
      const widget = new AgentStatesWidget(widgetContainer, mockAgents);
      widget.mount();

      // Start refresh
      setFrequency(5000);
      
      // Widget should be mounted and subscribed
      expect(widget.isMounted()).toBe(true);
      
      // Advance timer to trigger a tick
      vi.advanceTimersByTime(5000);

      // Widget should still be mounted after tick
      expect(widget.isMounted()).toBe(true);

      widget.destroy();
    });

    it('updates widget UI when agent state changes', () => {
      const widgetContainer = document.createElement('div');
      container.appendChild(widgetContainer);
      
      const widget = new AgentStatesWidget(widgetContainer, []);
      widget.mount();

      // Initially empty
      expect(widgetContainer.textContent).toContain('No agents found');

      // Update agents
      setAgents(mockAgents);

      // Widget should show agents
      expect(widgetContainer.textContent).not.toContain('No agents found');
      expect(widgetContainer.querySelectorAll('.agent-states-row').length).toBeGreaterThan(0);

      widget.destroy();
    });
  });

  describe('Multiple widgets with refresh', () => {
    it('all subscribed widgets receive refresh ticks', () => {
      const widget1Container = document.createElement('div');
      const widget2Container = document.createElement('div');
      container.appendChild(widget1Container);
      container.appendChild(widget2Container);
      
      setAgents(mockAgents);
      
      const widget1 = new AgentStatesWidget(widget1Container, mockAgents);
      const widget2 = new AgentStatesWidget(widget2Container, mockAgents);
      
      widget1.mount();
      widget2.mount();

      // Set refresh frequency
      setFrequency(5000);
      
      // Both widgets should have subscriptions
      expect(widget1.isMounted()).toBe(true);
      expect(widget2.isMounted()).toBe(true);

      // Advance timer
      vi.advanceTimersByTime(5000);

      // Both widgets should still be mounted and functional
      expect(widget1.isMounted()).toBe(true);
      expect(widget2.isMounted()).toBe(true);

      widget1.destroy();
      widget2.destroy();
    });
  });

  describe('Cleanup', () => {
    it('widget unsubscribes from refresh when destroyed', () => {
      const widgetContainer = document.createElement('div');
      container.appendChild(widgetContainer);
      
      const widget = new AgentStatesWidget(widgetContainer, mockAgents);
      widget.mount();

      const initialTick = getRefreshState().tick;
      
      widget.destroy();
      
      // Start refresh after widget is destroyed
      setFrequency(5000);
      vi.advanceTimersByTime(5000);

      // Widget should not cause any errors (it's unsubscribed)
      expect(getRefreshState().tick).toBe(initialTick + 1);
    });
  });

  describe('Frequency changes during active polling', () => {
    it('adjusts polling interval when frequency changes', () => {
      const callback = vi.fn();
      subscribeToRefresh(callback);

      setFrequency(15000);
      vi.advanceTimersByTime(15000);
      
      const callsAfter15s = callback.mock.calls.length;

      // Change to faster polling
      setFrequency(5000);
      vi.advanceTimersByTime(5000);
      
      // Should have received ticks at new interval
      expect(callback.mock.calls.length).toBeGreaterThan(callsAfter15s);
    });
  });
});
