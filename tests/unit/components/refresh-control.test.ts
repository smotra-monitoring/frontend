/**
 * Tests for RefreshControl component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RefreshControl } from '../../../src/components/refresh-control.js';
import { setFrequency, getRefreshState } from '../../../src/state/refresh-state.js';

describe('RefreshControl', () => {
  let container: HTMLElement;
  let refreshControl: RefreshControl;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Reset refresh manager state
    setFrequency('off');
  });

  afterEach(() => {
    refreshControl?.destroy();
    document.body.removeChild(container);
  });

  describe('render', () => {
    it('renders a select dropdown', () => {
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select');
      expect(select).toBeTruthy();
      expect(select?.getAttribute('aria-label')).toBe('Select dashboard refresh frequency');
    });

    it('renders all frequency options', () => {
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const options = container.querySelectorAll('option');
      expect(options.length).toBe(4); // Off, 5s, 15s, 30s
      
      const optionValues = Array.from(options).map(opt => opt.value);
      expect(optionValues).toContain('off');
      expect(optionValues).toContain('5000');
      expect(optionValues).toContain('15000');
      expect(optionValues).toContain('30000');
    });

    it('selects current frequency from refresh manager', () => {
      setFrequency(15000);
      
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('15000');
    });

    it('defaults to "off" when refresh manager is off', () => {
      setFrequency('off');
      
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('off');
    });

    it('renders with proper CSS classes', () => {
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      expect(container.querySelector('.refresh-control')).toBeTruthy();
      expect(container.querySelector('.select')).toBeTruthy();
    });
  });

  describe('user interaction', () => {
    it('updates refresh manager when frequency is selected', () => {
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select') as HTMLSelectElement;
      
      // Change to 5 seconds
      select.value = '5000';
      select.dispatchEvent(new Event('change'));

      expect(getRefreshState().frequency).toBe(5000);
    });

    it('sets frequency to "off" when "Off" is selected', () => {
      setFrequency(5000);
      
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select') as HTMLSelectElement;
      
      select.value = 'off';
      select.dispatchEvent(new Event('change'));

      expect(getRefreshState().frequency).toBe('off');
    });

    it('updates component state when frequency changes', () => {
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select') as HTMLSelectElement;
      
      select.value = '30000';
      select.dispatchEvent(new Event('change'));

      const state = refreshControl.getState();
      expect(state.currentFrequency).toBe(30000);
    });

    it('re-renders with new selection after change', () => {
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select') as HTMLSelectElement;
      
      select.value = '15000';
      select.dispatchEvent(new Event('change'));

      // After setState, component re-renders
      const updatedSelect = container.querySelector('select') as HTMLSelectElement;
      expect(updatedSelect.value).toBe('15000');
      
      const selectedOption = updatedSelect.querySelector('option[selected]');
      expect(selectedOption?.getAttribute('value')).toBe('15000');
    });
  });

  describe('lifecycle', () => {
    it('mounts successfully', () => {
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      expect(refreshControl.isMounted()).toBe(true);
      expect(container.querySelector('.refresh-control')).toBeTruthy();
    });

    it('cleans up event listeners on destroy', () => {
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select') as HTMLSelectElement;
      const spy = vi.spyOn(select, 'removeEventListener');

      refreshControl.destroy();

      expect(spy).toHaveBeenCalled();
      expect(refreshControl.isDestroyed()).toBe(true);
    });

    it('clears DOM on destroy', () => {
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      refreshControl.destroy();

      expect(container.innerHTML).toBe('');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const select = container.querySelector('select');
      expect(select?.getAttribute('aria-label')).toBe('Select dashboard refresh frequency');
    });

    it('has proper option labels', () => {
      refreshControl = new RefreshControl(container);
      refreshControl.mount();

      const options = Array.from(container.querySelectorAll('option'));
      const labels = options.map(opt => opt.textContent?.trim());
      
      expect(labels).toContain('Off');
      expect(labels).toContain('5s');
      expect(labels).toContain('15s');
      expect(labels).toContain('30s');
    });
  });
});
