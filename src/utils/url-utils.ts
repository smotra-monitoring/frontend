/**
 * URL utility functions for parsing OAuth callbacks and query parameters
 */

/**
 * Parse URL query parameters into an object
 */
export function parseQueryParams(url: string = window.location.href): Record<string, string> {
  const params: Record<string, string> = {};
  
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch (error) {
    console.error('Error parsing URL query parameters:', error);
  }
  
  return params;
}

/**
 * Get a specific query parameter value
 */
export function getQueryParam(name: string, defaultValue?: string): string | null;
export function getQueryParam(name: string, url?: string): string | null;
export function getQueryParam(name: string, urlOrDefault?: string): string | null {
  try {
    const url = urlOrDefault && urlOrDefault.includes('://') ? urlOrDefault : window.location.href;
    const urlObj = new URL(url);
    const value = urlObj.searchParams.get(name);
    
    // If value is null and urlOrDefault doesn't look like a URL, treat it as default value
    if (value === null && urlOrDefault && !urlOrDefault.includes('://')) {
      return urlOrDefault;
    }
    
    return value;
  } catch (error) {
    console.error('Error getting query parameter:', error);
    return urlOrDefault && !urlOrDefault.includes('://') ? urlOrDefault : null;
  }
}

/**
 * Set query parameter in current URL
 */
export function setQueryParam(key: string, value: string): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url.toString());
  } catch (error) {
    console.error('Error setting query parameter:', error);
  }
}

/**
 * Remove query parameter from current URL
 */
export function removeQueryParam(key: string): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url.toString());
  } catch (error) {
    console.error('Error removing query parameter:', error);
  }
}

/**
 * Parse query string into object
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  
  try {
    // Remove leading ? if present
    const cleanQuery = queryString.replace(/^\?/, '');
    if (!cleanQuery) {
      return params;
    }
    
    const searchParams = new URLSearchParams(cleanQuery);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch (error) {
    console.error('Error parsing query string:', error);
  }
  
  return params;
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any>): string {
  try {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
    
    // Convert + to %20 for consistency with URL encoding
    return searchParams.toString().replace(/\+/g, '%20');
  } catch (error) {
    console.error('Error building query string:', error);
    return '';
  }
}

/**
 * Build URL with query parameters
 */
export function buildUrl(baseUrl: string, params: Record<string, string | number>): string {
  try {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
    return url.toString();
  } catch (error) {
    console.error('Error building URL:', error);
    return baseUrl;
  }
}

/**
 * Parse OAuth callback URL and extract code, state, and error
 */
export function parseOAuthCallback(url: string = window.location.href): {
  code: string | null;
  state: string | null;
  error: string | null;
  error_description: string | null;
} {
  const params = parseQueryParams(url);
  
  return {
    code: params.code || null,
    state: params.state || null,
    error: params.error || null,
    error_description: params.error_description || null,
  };
}

/**
 * Remove query parameters from URL
 */
export function removeQueryParams(url: string = window.location.href): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch (error) {
    console.error('Error removing query parameters:', error);
    return url;
  }
}

/**
 * Update browser URL without reload
 */
export function updateUrl(url: string, title?: string): void {
  try {
    window.history.pushState({}, title || document.title, url);
  } catch (error) {
    console.error('Error updating URL:', error);
  }
}

/**
 * Replace browser URL without adding to history
 */
export function replaceUrl(url: string, title?: string): void {
  try {
    window.history.replaceState({}, title || document.title, url);
  } catch (error) {
    console.error('Error replacing URL:', error);
  }
}

/**
 * Get current path without query string or hash
 */
export function getCurrentPath(): string {
  return window.location.pathname;
}

/**
 * Check if current URL matches path pattern
 */
export function matchesPath(pattern: string): boolean {
  const current = getCurrentPath();
  
  // Exact match
  if (pattern === current) {
    return true;
  }
  
  // Wildcard match
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return current.startsWith(prefix);
  }
  
  return false;
}
