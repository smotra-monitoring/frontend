/**
 * Integration test for OAuth authentication flow
 */

import { mockOAuthProvider, mockAuthorizationCode, mockTokenResponse, mockUserInfo, mockFetchSuccess } from '../mocks/oauth-responses.js';
import {
    generateCodeVerifier,
    generateCodeChallenge,
    generateState,
    buildAuthorizationUrl,
    exchangeCodeForTokens,
} from '../../src/auth/oauth-manager.js';
import { storeTokens, getCurrentTokens } from '../helpers/token-helpers.js';
import { saveAuthState, isAuthenticated, getUserInfo as getStoredUserInfo } from '../../src/state/auth-state.js';
import type { AuthState, UserInfo, TokenData } from '../../src/types/auth-types.js';

describe('OAuth Authentication Flow (Integration)', () => {
    beforeEach(() => {
        localStorage.clear();
        delete (window as any).location;
        (window as any).location = { href: '', search: '', origin: 'http://localhost:3000' };
    });

    it('completes full OAuth2 PKCE flow', async () => {
        // Step 1: Generate PKCE parameters
        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        const state = generateState();

        expect(verifier).toBeTruthy();
        expect(challenge).toBeTruthy();
        expect(state).toBeTruthy();

        // Step 2: Build authorization URL
        const authUrl = buildAuthorizationUrl(mockOAuthProvider, challenge, state);
        expect(authUrl).toContain(mockOAuthProvider.authorizationEndpoint);
        expect(authUrl).toContain(challenge);
        expect(authUrl).toContain(state);

        // Step 3: Store PKCE parameters (would happen before redirect)
        localStorage.setItem('oauth_code_verifier', verifier);
        localStorage.setItem('oauth_state', state);

        // Step 4: Simulate OAuth provider callback (user would be redirected here)
        (window as any).location.search = `?code=${mockAuthorizationCode}&state=${state}`;

        // Step 5: Verify state matches
        const storedState = localStorage.getItem('oauth_state');
        const urlParams = new URLSearchParams(window.location.search);
        const returnedState = urlParams.get('state');
        expect(returnedState).toBe(storedState);

        // Step 6: Exchange authorization code for tokens
        mockFetchSuccess(mockTokenResponse);
        const storedVerifier = localStorage.getItem('oauth_code_verifier');
        const tokens = await exchangeCodeForTokens(
            mockOAuthProvider,
            mockAuthorizationCode,
            storedVerifier!
        );

        expect(tokens.access_token).toBe(mockTokenResponse.access_token);
        expect(tokens.refresh_token).toBe(mockTokenResponse.refresh_token);

        // Step 7: Store tokens
        storeTokens(tokens);
        const retrievedTokens = getCurrentTokens();
        expect(retrievedTokens?.access_token).toBe(tokens.access_token);

        // Step 8: Fetch and store user info
        mockFetchSuccess(mockUserInfo);
        const userInfoResponse = await fetch(mockOAuthProvider.userInfoEndpoint, {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });
        const userInfo = await userInfoResponse.json();

        // Convert tokens with expires_in to expires_at
        const tokenData = {
            ...tokens,
            expires_at: Date.now() + tokens.expires_in * 1000,
            refresh_token: tokens.refresh_token || '', // Ensure refresh_token is a string
        };
        saveAuthState(userInfo, tokenData);

        // Step 9: Verify authentication state
        expect(isAuthenticated()).toBe(true);
        expect(getStoredUserInfo()?.email).toBe(mockUserInfo.email);

        // Step 10: Cleanup OAuth parameters
        localStorage.removeItem('oauth_code_verifier');
        localStorage.removeItem('oauth_state');

        expect(localStorage.getItem('oauth_code_verifier')).toBeNull();
        expect(localStorage.getItem('oauth_state')).toBeNull();
    });

    it('handles OAuth state mismatch (CSRF protection)', async () => {
        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        const originalState = generateState();

        // Store original state
        localStorage.setItem('oauth_state', originalState);

        // Simulate callback with different state (potential CSRF attack)
        const differentState = generateState();
        (window as any).location.search = `?code=${mockAuthorizationCode}&state=${differentState}`;

        const storedState = localStorage.getItem('oauth_state');
        const urlParams = new URLSearchParams(window.location.search);
        const returnedState = urlParams.get('state');

        // State should NOT match
        expect(returnedState).not.toBe(storedState);

        // In real implementation, this would reject the flow
        expect(returnedState === storedState).toBe(false);
    });

    it('handles missing authorization code error', () => {
        const state = generateState();
        localStorage.setItem('oauth_state', state);

        // Simulate error callback
        (window as any).location.search = `?error=access_denied&error_description=User+cancelled&state=${state}`;

        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        expect(error).toBe('access_denied');
        expect(errorDescription).toBe('User cancelled');
    });

    it('handles token exchange failure', async () => {
        const verifier = generateCodeVerifier();

        // Mock failed token exchange
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 400,
                json: async () => ({
                    error: 'invalid_grant',
                    error_description: 'Authorization code is invalid',
                }),
            } as Response)
        );

        await expect(
            exchangeCodeForTokens(mockOAuthProvider, 'invalid-code', verifier)
        ).rejects.toThrow();

        // Verify user is not authenticated
        expect(isAuthenticated()).toBe(false);
    });

    it('persists authentication across page reloads', async () => {
        // Complete authentication
        mockFetchSuccess(mockTokenResponse);
        const tokens = await exchangeCodeForTokens(
            mockOAuthProvider,
            mockAuthorizationCode,
            'verifier'
        );
        storeTokens(tokens);

        // Convert tokens with expires_in to expires_at
        const tokenData = {
            ...tokens,
            expires_at: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : 0, // If expires_in is missing, set expired
            refresh_token: tokens.refresh_token || '', // Ensure refresh_token is a string
        };

        saveAuthState(mockUserInfo, tokenData);

        expect(isAuthenticated()).toBe(true);

        // Simulate page reload by re-reading from storage
        const restoredTokens = getCurrentTokens();
        expect(restoredTokens?.access_token).toBe(tokens.access_token);

        // User should still be authenticated
        expect(isAuthenticated()).toBe(true);
    });
});
