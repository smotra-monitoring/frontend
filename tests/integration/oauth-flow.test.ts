/**
 * Integration test for OAuth authentication flow
 * Tests the complete production path: initiateOAuthFlow → handleLoginCallback
 */

import { mockOAuthProvider, mockAuthorizationCode, mockTokenResponse, mockUserInfo } from '../mocks/oauth-responses.js';
import { initiateOAuthFlow } from '../../src/auth/oauth-manager.js';
import { handleLoginCallback } from '../../src/services/auth-service.js';
import { saveAuthState, clearAuthState, isAuthenticated, getUserInfo as getStoredUserInfo, loadAuthState } from '../../src/state/auth-state.js';

describe('OAuth Authentication Flow (Integration)', () => {
    beforeEach(() => {
        clearAuthState();
        jest.resetAllMocks();
        delete (window as any).location;
        (window as any).location = { href: '', search: '', origin: 'http://localhost:3000' };
    });

    /**
     * Runs initiateOAuthFlow and returns the state value stored in localStorage,
     * ready to embed in a callback URL.
     */
    async function initiateAndGetStoredState(): Promise<string> {
        await initiateOAuthFlow(mockOAuthProvider as any);
        return JSON.parse(localStorage.getItem('oauth_state')!);
    }

    /**
     * Mocks two sequential fetch calls made by handleLoginCallback:
     *   1. POST /auth/oauth2/token  — token exchange (backend)
     *   2. GET  /auth/userinfo      — user profile  (backend)
     */
    function mockBackendCalls(): void {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockTokenResponse,
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockUserInfo,
            } as unknown as Response);
    }

    it('completes full OAuth2 PKCE flow', async () => {
        // Initiate flow — generates PKCE + state, stores both, redirects to provider
        const storedState = await initiateAndGetStoredState();

        // Simulate provider redirecting back with authorization code
        window.location.href =
            `http://localhost:3000/auth/callback?code=${mockAuthorizationCode}&state=${storedState}`;

        mockBackendCalls();

        const result = await handleLoginCallback();

        expect(result).toBe(true);
        expect(isAuthenticated()).toBe(true);
        expect(getStoredUserInfo()?.email).toBe(mockUserInfo.email);
    });

    it('rejects callback when state does not match stored state (CSRF protection)', async () => {
        await initiateAndGetStoredState(); // seed real PKCE + state

        // Tampered state in callback URL — simulates CSRF attack
        window.location.href =
            `http://localhost:3000/auth/callback?code=${mockAuthorizationCode}&state=tampered-state`;

        const result = await handleLoginCallback();

        expect(result).toBe(false);
        expect(isAuthenticated()).toBe(false);
    });

    it('returns false when provider reports an error', async () => {
        // Error comes from the provider before state is checked
        window.location.href =
            'http://localhost:3000/auth/callback?error=access_denied&error_description=User+cancelled';

        const result = await handleLoginCallback();

        expect(result).toBe(false);
        expect(isAuthenticated()).toBe(false);
    });

    it('returns false when token exchange fails', async () => {
        const storedState = await initiateAndGetStoredState();

        window.location.href =
            `http://localhost:3000/auth/callback?code=${mockAuthorizationCode}&state=${storedState}`;

        // Backend rejects the token exchange
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: 'invalid_grant' }),
        } as unknown as Response);

        const result = await handleLoginCallback();

        expect(result).toBe(false);
        expect(isAuthenticated()).toBe(false);
    });

    it('persists authentication across page reloads', () => {
        // Seed complete auth state directly — no OAuth flow needed for this assertion
        const tokenData = {
            access_token: mockTokenResponse.access_token,
            refresh_token: mockTokenResponse.refresh_token,
            token_type: mockTokenResponse.token_type,
            expires_at: Date.now() + mockTokenResponse.expires_in * 1000,
        };
        saveAuthState(mockUserInfo, tokenData);

        expect(isAuthenticated()).toBe(true);

        // Simulate page reload — re-read tokens from storage
        loadAuthState();
        expect(isAuthenticated()).toBe(true);
    });
});
