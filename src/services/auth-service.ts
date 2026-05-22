/**
 * High-level authentication service
 * Orchestrates OAuth flow, token management,and user session
 */

import type { OAuth2Provider, UserInfo, TokenResponse } from '../types/auth-types.js';
import { initiateOAuthFlow, handleOAuthCallback, retrievePKCE, getOAuth2Config } from '../auth/oauth-manager.js';
import { oauth2Token } from '../api/index.js';
import { revokeTokens, scheduleTokenRefresh } from '../auth/token-manager.js';
import { saveAuthState, clearAuthState, setAuthLoading, setAuthError, getTokensFromState } from '../state/auth-state.js';
import { navigateTo } from '../utils/navigation.js';

// Token refresh cleanup function (tracks the current pending scheduled timeout)
let tokenRefreshCleanup: (() => void) | null = null;

/**
 * Schedule a token refresh cycle that automatically re-schedules itself after
 * each successful refresh, keeping the proactive refresh loop alive for the
 * entire session.
 */
function scheduleRefreshCycle(tokens: TokenResponse): void {
    if (tokenRefreshCleanup) {
        tokenRefreshCleanup();
    }
    tokenRefreshCleanup = scheduleTokenRefresh(tokens, (newTokens) => {
        // After a successful refresh, immediately schedule the next cycle using
        // the freshly issued tokens (which have a new expiration timestamp).
        scheduleRefreshCycle(newTokens);
    });
}

/**
 * Start OAuth login flow
 */
export async function login(provider: OAuth2Provider): Promise<void> {
    try {
        setAuthLoading(true);

        // Initiate OAuth flow (redirects user to provider)
        await initiateOAuthFlow(provider);
    } catch (error) {
        console.error('Login error:', error);
        setAuthError(error instanceof Error ? error.message : 'Login failed');
    }
}

/**
 * Handle OAuth callback and complete login
 */
export async function handleLoginCallback(): Promise<[boolean, string?]> {
    try {
        setAuthLoading(true);

        // Parse and validate callback
        const callbackResult = handleOAuthCallback();

        if (!callbackResult.valid || callbackResult.error) {
            const errorMessage = callbackResult.error || 'Authentication failed';
            setAuthError(errorMessage);
            return [false, errorMessage];
        }

        // Retrieve PKCE verifier
        const pkce = retrievePKCE();

        if (!pkce) {
            const errorMessage = 'PKCE verification failed';
            setAuthError(errorMessage);
            return [false, errorMessage];
        }

        // Exchange authorization code for tokens
        const tokens = await exchangeCodeForTokens(callbackResult.code!, pkce.code_verifier);

        if (!tokens) {
            const errorMessage = 'Token exchange failed';
            setAuthError(errorMessage);
            return [false, errorMessage];
        }

        const userInfo = await fetchUserInfo(tokens.opaque_token);

        if (!userInfo) {
            const errorMessage = 'Failed to fetch user information';
            setAuthError(errorMessage);
            return [false, errorMessage];
        }

        // Save authentication state
        saveAuthState(userInfo, tokens);

        // Schedule automatic token refresh (self-rescheduling cycle)
        scheduleRefreshCycle(tokens);

        return [true];
    } catch (error) {
        console.error('Callback handling error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        setAuthError(errorMessage);
        return [false, errorMessage];
    }
}

/**
 * Exchange authorization code for access and refresh tokens
 */
async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TokenResponse | null> {
    try {
        const providerConfig = getOAuth2Config();

        const { data, error } = await oauth2Token({
            body: {
                grant_type: 'authorization_code',
                code,
                code_verifier: codeVerifier,
                redirect_uri: providerConfig.redirectUri,
            },
        });

        if (error || !data) {
            const errorMessage =
                (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
                    ? error.message
                    : null) ||
                'Token exchange failed';

            throw new Error(errorMessage);
        }

        return {
            opaque_token: data.opaque_token,
            absolute_expires_at: data.absolute_expires_at,
        };
    } catch (error) {
        console.error('Token exchange error:', error);
        return null;
    }
}

/**
 * Fetch user information from API
 */
async function fetchUserInfo(accessToken: string): Promise<UserInfo | null> {

    try {
        // TODO: This would use the generated SDK function
        // import { getUserInfo } from '../api/sdk.gen.js';

        const providerConfig = getOAuth2Config();

        const response = await fetch(providerConfig.userinfoEndpoint, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        const data = await response.json();

        return {
            id: data.sub || data.id,
            email: data.email,
            name: data.name || data.given_name || data.email,
            picture: data.picture,
        };
    } catch (error) {
        console.error('User info fetch error:', error);
        return null;
    }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
    try {
        // Stop automatic token refresh
        if (tokenRefreshCleanup) {
            tokenRefreshCleanup();
            tokenRefreshCleanup = null;
        }

        // Revoke tokens on server
        await revokeTokens();

        // Clear local authentication state
        clearAuthState();

        // Navigate to login via the SPA router — no full page reload
        await navigateTo('/login', 'replace');
    } catch (error) {
        console.error('Logout error:', error);
        // Clear state anyway
        clearAuthState();
        await navigateTo('/login', 'replace');
    }
}

/**
 * Initialize authentication service
 * Call this on app bootstrap
 */
export function initializeAuthService(): void {
    // Load saved authentication state from localStorage
    const tokens = getTokensFromState();

    // If tokens exist, start the self-rescheduling refresh cycle
    if (tokens) {
        scheduleRefreshCycle(tokens);
    }
}
