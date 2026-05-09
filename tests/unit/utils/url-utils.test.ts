/**
 * Tests for URL utilities
 */

import {
  getQueryParam,
  setQueryParam,
  removeQueryParam,
  parseQueryString,
  buildQueryString,
} from '../../../src/utils/url-utils.js';

describe('url-utils', () => {
  beforeEach(() => {
    // Reset URL
    window.history.pushState({}, '', '/');
  });

  describe('getQueryParam', () => {
    it('retrieves query parameter from current URL', () => {
      window.history.pushState({}, '', '/?code=abc123');
      expect(getQueryParam('code')).toBe('abc123');
    });

    it('returns null for non-existent parameter', () => {
      window.history.pushState({}, '', '/');
      expect(getQueryParam('code')).toBeNull();
    });

    it('returns default value when parameter not found', () => {
      expect(getQueryParam('missing', 'default')).toBe('default');
    });

    it('handles URL-encoded values', () => {
      window.history.pushState({}, '', '/?name=John%20Doe');
      expect(getQueryParam('name')).toBe('John Doe');
    });
  });

  describe('setQueryParam', () => {
    it('adds query parameter to URL', () => {
      setQueryParam('theme', 'dark');
      expect(window.location.search).toContain('theme=dark');
    });

    it('updates existing query parameter', () => {
      window.history.pushState({}, '', '/?theme=light');
      setQueryParam('theme', 'dark');
      expect(window.location.search).toContain('theme=dark');
      expect(window.location.search).not.toContain('theme=light');
    });

    it('preserves other query parameters', () => {
      window.history.pushState({}, '', '/?foo=bar');
      setQueryParam('theme', 'dark');
      expect(window.location.search).toContain('foo=bar');
      expect(window.location.search).toContain('theme=dark');
    });
  });

  describe('removeQueryParam', () => {
    it('removes query parameter from URL', () => {
      window.history.pushState({}, '', '/?theme=dark&lang=en');
      removeQueryParam('theme');
      expect(window.location.search).not.toContain('theme');
      expect(window.location.search).toContain('lang=en');
    });

    it('handles removing non-existent parameter', () => {
      window.history.pushState({}, '', '/?theme=dark');
      expect(() => removeQueryParam('missing')).not.toThrow();
      expect(window.location.search).toContain('theme=dark');
    });
  });

  describe('parseQueryString', () => {
    it('parses query string into object', () => {
      const result = parseQueryString('?code=abc123&state=xyz');
      expect(result).toEqual({
        code: 'abc123',
        state: 'xyz',
      });
    });

    it('handles query string without leading ?', () => {
      const result = parseQueryString('code=abc123&state=xyz');
      expect(result).toEqual({
        code: 'abc123',
        state: 'xyz',
      });
    });

    it('returns empty object for empty string', () => {
      expect(parseQueryString('')).toEqual({});
      expect(parseQueryString('?')).toEqual({});
    });

    it('handles URL-encoded values', () => {
      const result = parseQueryString('name=John%20Doe&email=test%40example.com');
      expect(result).toEqual({
        name: 'John Doe',
        email: 'test@example.com',
      });
    });
  });

  describe('buildQueryString', () => {
    it('builds query string from object', () => {
      const params = {
        code: 'abc123',
        state: 'xyz',
      };
      expect(buildQueryString(params)).toBe('code=abc123&state=xyz');
    });

    it('URL-encodes values', () => {
      const params = {
        name: 'John Doe',
        email: 'test@example.com',
      };
      const result = buildQueryString(params);
      expect(result).toContain('John%20Doe');
      expect(result).toContain('test%40example.com');
    });

    it('returns empty string for empty object', () => {
      expect(buildQueryString({})).toBe('');
    });

    it('handles numeric and boolean values', () => {
      const params = {
        count: 42,
        enabled: true,
      };
      const result = buildQueryString(params);
      expect(result).toContain('count=42');
      expect(result).toContain('enabled=true');
    });

    it('handle plus sign in values', () => {
      const params = {
        query: 'a+b c',
      };
      const result = buildQueryString(params);
      expect(result).toBe('query=a%2Bb%20c');
    });
  });
});
