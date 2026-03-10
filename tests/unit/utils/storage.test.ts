/**
 * Tests for storage utility
 */

import { getItem, setItem, removeItem, clear } from '../../../src/utils/storage.js';

describe('storage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('setItem and getItem', () => {
    it('stores and retrieves string values', () => {
      setItem('test-key', 'test-value');
      expect(getItem('test-key')).toBe('test-value');
    });

    it('stores and retrieves object values', () => {
      const testObj = { name: 'test', count: 42 };
      setItem('test-obj', testObj);
      expect(getItem('test-obj')).toEqual(testObj);
    });

    it('stores and retrieves nested objects', () => {
      const nested = {
        user: {
          name: 'Test',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
      };
      setItem('nested', nested);
      expect(getItem('nested')).toEqual(nested);
    });

    it('returns null for non-existent keys', () => {
      expect(getItem('non-existent')).toBeNull();
    });

    it('returns default value for non-existent keys', () => {
      expect(getItem('non-existent', 'default')).toBe('default');
    });

    it('handles arrays', () => {
      const arr = ['a', 'b', 'c'];
      setItem('array', arr);
      expect(getItem('array')).toEqual(arr);
    });

    it('handles numbers', () => {
      setItem('number', 123);
      expect(getItem('number')).toBe(123);
    });

    it('handles booleans', () => {
      setItem('bool', true);
      expect(getItem('bool')).toBe(true);
    });
  });

  describe('removeItem', () => {
    it('removes a stored item', () => {
      setItem('to-remove', 'value');
      expect(getItem('to-remove')).toBe('value');

      removeItem('to-remove');
      expect(getItem('to-remove')).toBeNull();
    });

    it('does not throw when removing non-existent item', () => {
      expect(() => removeItem('non-existent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('clears all stored items', () => {
      setItem('key1', 'value1');
      setItem('key2', 'value2');
      setItem('key3', 'value3');

      clear();

      expect(getItem('key1')).toBeNull();
      expect(getItem('key2')).toBeNull();
      expect(getItem('key3')).toBeNull();
    });
  });

  describe('error handling', () => {
    it('handles corrupted JSON gracefully', () => {
      localStorage.setItem('corrupted', '{invalid json');
      expect(getItem('corrupted')).toBeNull();
    });

    it('handles storage exceptions', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => setItem('key', 'value')).not.toThrow();

      // Restore
      Storage.prototype.setItem = originalSetItem;
    });

    it('handles storage exceptions by spying on an error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
      const setItemSpy = jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // 1. Verify it doesn't crash the UI
      expect(() => setItem('key', 'value')).not.toThrow();

      // 2. Verify the error was actually handled/logged
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('Error');
      expect(consoleSpy.mock.calls[0][1]).toBeInstanceOf(Error);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error'), expect.any(Error));

      consoleSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });
});
