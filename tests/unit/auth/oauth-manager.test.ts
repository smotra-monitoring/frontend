/**
 * Tests for OAuth PKCE implementation
 */

import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
} from '../../../src/auth/oauth-manager.js';
import {
  mockOAuthProvider,
  mockAuthorizationCode,
  mockTokenResponse,
  mockFetchSuccess,
} from '../../mocks/oauth-responses.js';

describe('oauth-manager', () => {
  describe('PKCE generation', () => {
    it('generates random code verifier of correct length', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toHaveLength(43); // Base64url of 32 bytes
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/); // Base64url charset
    });

    it('generates unique code verifiers', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });

    it('generates code challenge from verifier', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      
      expect(challenge).toBeTruthy();
      expect(challenge).toHaveLength(43); // Base64url of SHA-256 hash
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('generates consistent challenge for same verifier', async () => {
      const verifier = 'test-verifier-123';
      const challenge1 = await generateCodeChallenge(verifier);
      const challenge2 = await generateCodeChallenge(verifier);
      expect(challenge1).toBe(challenge2);
    });
  });

  describe('state generation', () => {
    it('generates random state parameter', () => {
      const state = generateState();
      expect(state).toBeTruthy();
      expect(state.length).toBeGreaterThan(16);
    });

    it('generates unique state values', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
    });
  });

  describe('buildAuthorizationUrl', () => {
    it('builds correct authorization URL', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const state = generateState();

      const url = buildAuthorizationUrl(
        mockOAuthProvider,
        challenge,
        state
      );

      expect(url).toContain(mockOAuthProvider.authorizationEndpoint);
      expect(url).toContain(`client_id=${mockOAuthProvider.clientId}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(mockOAuthProvider.redirectUri)}`);
      expect(url).toContain(`code_challenge=${challenge}`);
      expect(url).toContain('code_challenge_method=S256');
      expect(url).toContain(`state=${state}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid+profile+email');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('exchanges authorization code for tokens', async () => {
      mockFetchSuccess(mockTokenResponse);

      const tokens = await exchangeCodeForTokens(
        mockOAuthProvider,
        mockAuthorizationCode,
        'test-verifier'
      );

      expect(tokens).toEqual(mockTokenResponse);
      expect(fetch).toHaveBeenCalledWith(
        mockOAuthProvider.tokenEndpoint,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });

    it('includes code_verifier in token request', async () => {
      mockFetchSuccess(mockTokenResponse);

      await exchangeCodeForTokens(
        mockOAuthProvider,
        mockAuthorizationCode,
        'test-verifier'
      );

      const callBody = (fetch as jest.Mock).mock.calls[0][1].body;
      expect(callBody).toContain('code_verifier=test-verifier');
    });

    it('throws error on failed token exchange', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ error: 'invalid_grant' }),
        } as Response)
      );

      await expect(
        exchangeCodeForTokens(mockOAuthProvider, 'invalid-code', 'verifier')
      ).rejects.toThrow();
    });
  });
});
