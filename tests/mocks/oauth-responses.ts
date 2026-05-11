/**
 * Mock OAuth responses for testing
 */

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

export const mockTokenResponse = {
  access_token: 'mock-access-token-abcdef123456',
  refresh_token: 'mock-refresh-token-xyz789',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'openid profile email',
};

export const mockRefreshTokenResponse = {
  access_token: 'mock-new-access-token-123456',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'openid profile email',
};

export const mockUserInfo = {
  id: 'user-123',
  sub: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
  email_verified: true,
};

export const mockTokens = {
  access_token: mockTokenResponse.access_token,
  refresh_token: mockTokenResponse.refresh_token,
  expires_at: Date.now() + mockTokenResponse.expires_in * 1000,
  token_type: mockTokenResponse.token_type,
};

export const mockAuthState = {
  isAuthenticated: true,
  user: mockUserInfo,
  tokens: mockTokens,
  expiresAt: Date.now() + 3600000, // 1 hour from now
};

export function mockFetchSuccess(response: any): void {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => response,
      status: 200,
      statusText: 'OK',
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
    } as Response)
  );
}
