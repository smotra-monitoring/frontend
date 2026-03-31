/**
 * Token manager for handling access and refresh tokens
 */

import type { TokenData, TokenRefreshResult } from '../types/auth-types.js';
import { getTokensFromState, updateTokensInState, clearAuthState, isTokenExpiredInState } from '../state/auth-state.js';

// Import generated SDK functions (will be available after openapi-ts runs)
// import { oauth2Token } from '../api/sdk.gen.js';

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string | null> {
  // If token is still valid, return it
  if (!isTokenExpiredInState()) {
    const tokens = getTokensFromState() as TokenData;
    return tokens.access_token;
  }

  // Token is expired or about to expire, refresh it
  const refreshResult = await refreshAccessToken();

  if (refreshResult.success && refreshResult.tokens) {
    return refreshResult.tokens.access_token;
  }

  return null;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<TokenRefreshResult> {
  const tokens = getTokensFromState();

  if (!tokens || !tokens.refresh_token) {
    console.warn('No refresh token available for refreshing access token');

    return {
      success: false,
      error: 'No refresh token available',
    };
  }

  try {
    // TODO: Replace with actual API call to refresh token using the refresh token

    // This would use the generated SDK function
    // const response = await oauth2Token({
    //   body: {
    //     grant_type: 'refresh_token',
    //     refresh_token: tokens.refresh_token,
    //   },
    // });

    // For now, placeholder implementation
    // In production, this calls the actual API endpoint
    const response = await fetch('/auth/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh request failed with status ' + response.status);
    }

    const data = await response.json();

    // Calculate expiration timestamp
    const expires_at = Date.now() + (data.expires_in * 1000);

    const newTokens: TokenData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || tokens.refresh_token, // Use new or keep old
      expires_at,
      token_type: data.token_type || 'Bearer',
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
 * Revoke access and refresh tokens
 */
export async function revokeTokens(): Promise<boolean> {
  const tokens = getTokensFromState();

  if (!tokens) {
    return true; // No tokens to revoke
  }

  try {
    // TODO: Replace with generated SDK function to revoke tokens

    // Revoke access token
    if (tokens.access_token) {
      await fetch('/auth/oauth2/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokens.access_token,
          token_type_hint: 'access_token',
        }),
      });
    }

    // TODO: Replace with generated SDK function to revoke tokens

    // Revoke refresh token
    if (tokens.refresh_token) {
      await fetch('/auth/oauth2/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokens.refresh_token,
          token_type_hint: 'refresh_token',
        }),
      });
    }

    return true;
  } catch (error) {
    console.error('Token revocation error:', error);
    return false;
  }
}

/**
 * Schedule automatic token refresh before expiration.
 *
 * @param tokens - Current token data with expiration timestamp.
 * @param onRefreshComplete - Optional callback invoked with new tokens after a
 *   successful refresh. Use this to chain the next refresh cycle (e.g. call
 *   scheduleTokenRefresh again) so the proactive refresh loop continues for the
 *   entire session rather than firing only once.
 * @returns Cleanup function that cancels the pending timeout.
 */
export function scheduleTokenRefresh(
  tokens: TokenData,
  onRefreshComplete?: (newTokens: TokenData) => void,
): () => void {
  const now = Date.now();
  const expiresAt = tokens.expires_at;
  const refreshBuffer = 5 * 60 * 1000; // Refresh 5 minutes before expiration

  const refreshTime = expiresAt - now - refreshBuffer;

  // Token already expired or expiring very soon — refresh immediately
  if (refreshTime <= 0) {
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
  }, refreshTime);

  // Return cleanup function
  return () => {
    clearTimeout(timeoutId);
  };
}

/**
 * Extract token expiration timestamp from JWT
 * (Fallback if expires_in not provided by server)
 */
export function extractTokenExpiration(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]!));

    if (payload.exp) {
      return payload.exp * 1000; // Convert to milliseconds
    }

    return null;
  } catch (error) {
    console.error('Error extracting token expiration:', error);
    return null;
  }
}
