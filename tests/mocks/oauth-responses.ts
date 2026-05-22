/**
 * Mock OAuth responses for testing
 */

import type { TokenResponse } from '../../src/api/index.js';

export const mockOAuthProvider = {
  provider: 'okta',
  clientId: 'test-client-id',
  authorizationEndpoint: 'https://test.okta.com/oauth2/v1/authorize',
  tokenEndpoint: 'https://test.okta.com/oauth2/v1/token',
  userInfoEndpoint: 'https://test.okta.com/oauth2/v1/userinfo',
  redirectUri: 'http://localhost:3000/auth/callback',
  scopes: ['openid', 'profile', 'email'],
};

export const mockAuthorizationCode = 'mock-auth-code-123456';

export const mockCodeVerifier = 'mock-code-verifier-123456789012345678901234567890123456789012';
export const mockCodeChallenge = 'mock-code-challenge-encoded';

export const mockState = 'mock-state-random-string';

/**
 * Raw JSON as the server returns it (absolute_expires_at as ISO string).
 * Used when mocking global.fetch for the token exchange and refresh endpoints.
 */
export const mockTokenResponse = {
  opaque_token: 'st_live_mock_token_abcdef123456',
  absolute_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
};

/**
 * Raw JSON for a refreshed token response (from /auth/refresh).
 */
export const mockRefreshTokenResponse = {
  opaque_token: 'st_live_mock_refreshed_token_xyz789',
  absolute_expires_at: new Date(Date.now() + 7200 * 1000).toISOString(),
};

export const mockUserInfo = {
  id: 'user-123',
  sub: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
  email_verified: true,
};

/**
 * TokenResponse as returned by the SDK after date transformation.
 * Use this whenever you need a typed TokenResponse (e.g. updateTokensInState).
 */
export const mockToken: TokenResponse = {
  opaque_token: 'st_live_mock_token_abcdef123456',
  absolute_expires_at: new Date(Date.now() + 3600 * 1000),
};

export const mockAuthState = {
  isAuthenticated: true,
  user: mockUserInfo,
  tokens: mockToken,
};

export function mockFetchSuccess(response: any): void {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => response,
      status: 200,
      statusText: 'OK',
      headers: { get: (name: string) => name.toLowerCase() === 'content-type' ? 'application/json' : null },
    } as Response)
  );
}

export function mockFetchError(status: number, message: string): void {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      json: async () => ({ error: message }),
      status,
      statusText: message,
      headers: { get: (name: string) => name.toLowerCase() === 'content-type' ? 'application/json' : null },
    } as Response)
  );
}
