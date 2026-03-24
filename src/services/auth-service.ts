/**
 * High-level authentication service
 * Orchestrates OAuth flow, token management,and user session
 */

import type { OAuth2Provider, UserInfo, TokenData } from '../types/auth-types.js';
import { initiateOAuthFlow, handleOAuthCallback, retrievePKCE, getProviderConfig } from '../auth/oauth-manager.js';
import { revokeTokens, scheduleTokenRefresh } from '../auth/token-manager.js';
import { saveAuthState, clearAuthState, setAuthLoading, setAuthError, getTokensFromState } from '../state/auth-state.js';

// Token refresh cleanup function
let tokenRefreshCleanup: (() => void) | null = null;

/**
 * Start OAuth login flow
 */
export async function login(provider: OAuth2Provider): Promise<void> {
    try {
        setAuthLoading(true);

        // Get provider configuration
        const providerConfig = getProviderConfig(provider);

        // In production, these would come from environment variables
        const config = {
            provider,
            clientId: 'your-client-id',
            redirectUri: `${window.location.origin}/auth/callback`,
            ...providerConfig,
        } as any;

        // Initiate OAuth flow (redirects user to provider)
        await initiateOAuthFlow(config);
    } catch (error) {
        console.error('Login error:', error);
        setAuthError(error instanceof Error ? error.message : 'Login failed');
    }
}

/**
 * Handle OAuth callback and complete login
 */
export async function handleLoginCallback(): Promise<boolean> {
    try {
        setAuthLoading(true);

        // Parse and validate callback
        const callback = handleOAuthCallback();

        if (!callback.valid || callback.error) {
            setAuthError(callback.error || 'Authentication failed');
            return false;
        }

        // Retrieve PKCE verifier
        const pkce = retrievePKCE();

        if (!pkce) {
            setAuthError('PKCE verification failed');
            return false;
        }

        // Exchange authorization code for tokens
        const tokens = await exchangeCodeForTokens(callback.code!, pkce.code_verifier);

        if (!tokens) {
            setAuthError('Token exchange failed');
            return false;
        }

        // Fetch user info
        const userInfo = await fetchUserInfo(tokens.access_token);

        if (!userInfo) {
            setAuthError('Failed to fetch user information');
            return false;
        }

        // Save authentication state
        saveAuthState(userInfo, tokens);

        // Schedule automatic token refresh
        tokenRefreshCleanup = scheduleTokenRefresh(tokens);

        return true;
    } catch (error) {
        console.error('Callback handling error:', error);
        setAuthError(error instanceof Error ? error.message : 'Authentication failed');
        return false;
    }
}

/**
 * Exchange authorization code for access and refresh tokens
 */
async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TokenData | null> {
    try {
        // This would use the generated SDK function
        // import { oauth2Token } from '../api/sdk.gen.js';

        const response = await fetch('/auth/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                code_verifier: codeVerifier,
                redirect_uri: `${window.location.origin}/auth/callback`,
            }),
        });

        if (!response.ok) {
            throw new Error('Token exchange failed');
        }

        const data = await response.json();

        // Calculate expiration timestamp
        const expires_at = Date.now() + (data.expires_in * 1000);

        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at,
            token_type: data.token_type || 'Bearer',
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
        // This would use the generated SDK function
        // import { getUserInfo } from '../api/sdk.gen.js';

        const response = await fetch('/auth/userinfo', {
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

        // Redirect to login page
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        // Clear state anyway
        clearAuthState();
        window.location.href = '/login';
    }
}

/**
 * Initialize authentication service
 * Call this on app bootstrap
 */
export function initializeAuthService(): void {
    // Load saved authentication state from localStorage
    const tokens = getTokensFromState();

    // If tokens exist, schedule refresh
    if (tokens) {
        tokenRefreshCleanup = scheduleTokenRefresh(tokens);
    }
}
