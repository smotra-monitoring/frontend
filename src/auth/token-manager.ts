/**
 * Token manager for handling opaque session tokens
 */

import type { TokenRefreshResult } from '../types/auth-types.js';
import type { TokenResponse } from '../api/index.js';
import { getTokensFromState, updateTokensInState, clearAuthState, isTokenExpiredInState } from '../state/auth-state.js';
import { authRefresh, oauth2Revoke } from '../api/index.js';

/**
 * Get valid opaque session token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string | null> {
  // If token is still valid, return it
  if (!isTokenExpiredInState()) {
    const tokens = getTokensFromState() as TokenResponse;
    return tokens.opaque_token;
  }

  // Token is expired or about to expire, refresh it
  const refreshResult = await refreshAccessToken();

  if (refreshResult.success && refreshResult.tokens) {
    return refreshResult.tokens.opaque_token;
  }

  return null;
}

/**
 * Refresh the session by calling /auth/refresh with the current opaque token.
 * The server issues a new opaque token and revokes the old one atomically.
 */
export async function refreshAccessToken(): Promise<TokenRefreshResult> {
  const tokens = getTokensFromState();

  if (!tokens || !tokens.opaque_token) {
    console.warn('No opaque token available for refreshing session');

    return {
      success: false,
      error: 'No token available',
    };
  }

  try {
    const { data, error } = await authRefresh({
      headers: {
        Authorization: `Bearer ${tokens.opaque_token}`,
      },
    });

    if (error || !data) {
      const errorMessage =
        (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
          ? error.message
          : null) || 'Token refresh failed';
      throw new Error(errorMessage);
    }

    const newTokens: TokenResponse = {
      opaque_token: data.opaque_token,
      expires_at: data.expires_at,
    };

    // Update tokens in state and storage
    updateTokensInState(newTokens);

    return {
      success: true,
      tokens: newTokens,
    };
  } catch (error) {
    console.error('Token refresh error:', error);

    // Clear auth state on refresh failure
    clearAuthState();

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh request failed',
    };
  }
}

/**
 * Revoke the current opaque session token via /auth/oauth2/revoke.
 */
export async function revokeTokens(): Promise<boolean> {
  const tokens = getTokensFromState();

  if (!tokens) {
    return true; // No tokens to revoke
  }

  try {
    await oauth2Revoke({
      body: {
        opaque_token: tokens.opaque_token,
      },
      headers: {
        Authorization: `Bearer ${tokens.opaque_token}`,
      },
    });

    clearAuthState();

    return true;
  } catch (error) {
    console.error('Token revocation error:', error);
    return false;
  }
}

/**
 * Schedule automatic token refresh at the half-life point of the token's
 * remaining lifetime. This ensures the client proactively refreshes well
 * before the hard expiry (expires_at) without waiting until the
 * last minute.
 *
 * @param tokens - Current token data with expiration timestamp.
 * @param onRefreshComplete - Optional callback invoked with new tokens after a
 *   successful refresh. Use this to chain the next refresh cycle so the
 *   proactive refresh loop continues for the entire session.
 * @returns Cleanup function that cancels the pending timeout.
 */
export function scheduleTokenRefresh(
  tokens: TokenResponse,
  onRefreshComplete?: (newTokens: TokenResponse) => void,
): () => void {
  const now = Date.now();
  const timeUntilExpiry = new Date(tokens.expires_at).getTime() - now;

  // Schedule at the midpoint (half-life)
  const refreshDelay = Math.min(timeUntilExpiry / 2, 2147483647); // Cap at max setTimeout value, which is ~24.8 days

  // Token already expired or expiring very soon — refresh immediately
  if (refreshDelay <= 0) {
    refreshAccessToken().then((result) => {
      if (result.success && result.tokens) {
        onRefreshComplete?.(result.tokens);
      }
    });
    return () => { };
  }

  const timeoutId = setTimeout(async () => {
    const result = await refreshAccessToken();
    if (result.success && result.tokens) {
      onRefreshComplete?.(result.tokens);
    }
  }, refreshDelay);

  // Return cleanup function
  return () => {
    clearTimeout(timeoutId);
  };
}
