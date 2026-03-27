/**
 * Token test helpers
 * Utilities for managing tokens in test environments
 */

import type { TokenData } from '../../src/types/auth-types.js';
import { getTokensFromState, updateTokensInState, clearAuthState } from '../../src/state/auth-state.js';
import { Storage } from '../../src/utils/storage.js';

const TOKEN_STORAGE_KEY = 'auth_tokens';

/**
 * Store tokens in state and localStorage for testing
 */
export function storeTokens(tokens: TokenData | any): void {
    // Calculate expires_at if only expires_in is provided
    let tokenData: TokenData;
    if ('expires_in' in tokens && !('expires_at' in tokens)) {
        tokenData = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_type: tokens.token_type || 'Bearer',
            expires_at: Date.now() + (tokens.expires_in * 1000),
        };
    } else {
        tokenData = tokens as TokenData;
    }

    // TODO: consider removing localStorage usage in tests and rely solely on state for better test isolation
    // re-check after oauth-flow.tests.ts will be reviewed
    // Because this is the only place colling getCurrentTokens, which reads from localStorage, and it is used in token-manager tests, which also use localStorage to store tokens, it is better to keep it for now to avoid breaking tests. But in the future we should consider refactoring tests to rely solely on state for better isolation and testability.

    // Store to localStorage
    Storage.set(TOKEN_STORAGE_KEY, tokenData);

    // Update state
    updateTokensInState(tokenData);
}

/**
 * Get current tokens from localStorage and state for testing
 */
export function getCurrentTokens(): TokenData | null {
    // Read from localStorage directly to sync with tests
    const storedTokens = Storage.get<TokenData>(TOKEN_STORAGE_KEY);
    if (storedTokens) {
        // Check if expired
        if (storedTokens.expires_at > Date.now()) {
            return storedTokens;
        }
    }

    // // Fallback to state
    // const stateTokens = getTokensFromState();
    // if (stateTokens) {
    //     return stateTokens;
    // }

    return null;
}

/**
 * Clear all stored tokens for testing
 */
export function clearTokens(): void {
    Storage.remove(TOKEN_STORAGE_KEY);
    clearAuthState();
}

/**
 * Check if access token is expired or about to expire for testing
 */
export function isTokenExpired(tokens: TokenData | null, bufferSeconds: number = 60): boolean {
    if (!tokens) {
        return true;
    }

    const now = Date.now();
    const expiresAt = tokens.expires_at;

    // Check if token expires within buffer period
    return expiresAt <= now + (bufferSeconds * 1000);
}
