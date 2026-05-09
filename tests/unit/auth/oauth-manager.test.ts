/**
 * Unit tests for OAuth2 production functions
 * Tests business logic: PKCE storage, state validation, CSRF protection, error handling
 */

import {
  initiateOAuthFlow,
  handleOAuthCallback,
  retrievePKCE,
} from '../../../src/auth/oauth-manager.js';
import { mockOAuthProvider } from '../../mocks/oauth-responses.js';

// Storage keys used internally by oauth-manager
const PKCE_KEY = 'oauth_pkce';
const STATE_KEY = 'oauth_state';

describe('oauth-manager', () => {
  beforeEach(() => {
    localStorage.clear();
    // Replace window.location with a writable object so href assignment is captured
    delete (window as any).location;
    (window as any).location = { href: '', search: '', origin: 'http://localhost:3000' };
  });

  describe('initiateOAuthFlow', () => {
    it('stores PKCE verifier and challenge in localStorage before redirect', async () => {
      await initiateOAuthFlow(mockOAuthProvider as any);

      const stored = JSON.parse(localStorage.getItem(PKCE_KEY)!);
      expect(stored).toMatchObject({
        code_verifier: expect.any(String),
        code_challenge: expect.any(String),
        code_challenge_method: 'S256',
      });
    });

    it('stores state in localStorage before redirect', async () => {
      await initiateOAuthFlow(mockOAuthProvider as any);

      const state = localStorage.getItem(STATE_KEY);
      expect(state).not.toBeNull();
      // State is stored as a JSON string; unwrap it
      const parsed = JSON.parse(state!);
      expect(typeof parsed).toBe('string');
      expect(parsed.length).toBeGreaterThan(16);
    });

    it('redirects to the provider authorization endpoint', async () => {
      await initiateOAuthFlow(mockOAuthProvider as any);

      expect(window.location.href).toContain(mockOAuthProvider.authorizationEndpoint);
    });

    it('includes required OAuth parameters in the redirect URL', async () => {
      await initiateOAuthFlow(mockOAuthProvider as any);

      const url = new URL(window.location.href);
      expect(url.searchParams.get('client_id')).toBe(mockOAuthProvider.clientId);
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('code_challenge')).toBeTruthy();
      expect(url.searchParams.get('state')).toBeTruthy();
      expect(url.searchParams.get('redirect_uri')).toBe(mockOAuthProvider.redirectUri);
    });

    it('uses the stored state value in the redirect URL', async () => {
      await initiateOAuthFlow(mockOAuthProvider as any);

      const storedState = JSON.parse(localStorage.getItem(STATE_KEY)!);
      const urlState = new URL(window.location.href).searchParams.get('state');
      expect(urlState).toBe(storedState);
    });
  });

  describe('handleOAuthCallback', () => {
    function seedState(state: string): void {
      // oauth-manager stores state via Storage.set which JSON-serialises the value
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    }

    it('returns valid result when state matches and code is present', () => {
      const state = 'valid-state-abc123';
      seedState(state);
      window.location.href = `http://localhost:3000/auth/callback?code=auth-code-xyz&state=${state}`;

      const result = handleOAuthCallback();

      expect(result.valid).toBe(true);
      expect(result.code).toBe('auth-code-xyz');
      expect(result.error).toBeNull();
    });

    it('rejects callback when state does not match stored state (CSRF protection)', () => {
      seedState('original-state');
      window.location.href = 'http://localhost:3000/auth/callback?code=auth-code-xyz&state=tampered-state';

      const result = handleOAuthCallback();

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/invalid state/i);
      expect(result.code).toBeNull();
    });

    it('rejects callback when state parameter is missing', () => {
      seedState('some-state');
      window.location.href = 'http://localhost:3000/auth/callback?code=auth-code-xyz';

      const result = handleOAuthCallback();

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/invalid state/i);
      expect(result.code).toBeNull();
    });

    it('returns error from provider when error parameter is present', () => {
      window.location.href =
        'http://localhost:3000/auth/callback?error=access_denied&error_description=User+cancelled&state=some-state';

      const result = handleOAuthCallback();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('User cancelled');
      expect(result.code).toBeNull();
    });

    it('falls back to error code when error_description is absent', () => {
      window.location.href =
        'http://localhost:3000/auth/callback?error=server_error&state=some-state';

      const result = handleOAuthCallback();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('server_error');
    });

    it('returns error when state is valid but authorization code is missing', () => {
      const state = 'valid-no-code-state';
      seedState(state);
      window.location.href = `http://localhost:3000/auth/callback?state=${state}`;

      const result = handleOAuthCallback();

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/no authorization code/i);
    });

    it('consumes the stored state (single-use, prevents replay)', () => {
      const state = 'one-time-state';
      seedState(state);
      window.location.href = `http://localhost:3000/auth/callback?code=code-1&state=${state}`;

      handleOAuthCallback(); // first call — consumes state

      // Second call with same URL: stored state already removed, should fail
      window.location.href = `http://localhost:3000/auth/callback?code=code-2&state=${state}`;
      const secondResult = handleOAuthCallback();
      expect(secondResult.valid).toBe(false);
    });
  });

  describe('retrievePKCE', () => {
    it('returns stored PKCE data', () => {
      const pkce = { code_verifier: 'verifier', code_challenge: 'challenge', code_challenge_method: 'S256' };
      localStorage.setItem(PKCE_KEY, JSON.stringify(pkce));

      const result = retrievePKCE();

      expect(result).toEqual(pkce);
    });

    it('removes PKCE from storage after retrieval (single-use)', () => {
      const pkce = { code_verifier: 'verifier', code_challenge: 'challenge', code_challenge_method: 'S256' };
      localStorage.setItem(PKCE_KEY, JSON.stringify(pkce));

      retrievePKCE();

      expect(localStorage.getItem(PKCE_KEY)).toBeNull();
    });

    it('returns null when no PKCE is stored', () => {
      expect(retrievePKCE()).toBeNull();
    });
  });
});
