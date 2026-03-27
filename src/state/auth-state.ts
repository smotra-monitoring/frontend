/**
 * Authentication state management
 */

import { createState } from './global-state.js';
import type { AuthState, UserInfo, TokenData } from '../types/auth-types.js';
import { Storage } from '../utils/storage.js';

const STORAGE_KEY = 'auth';

// Initial authentication state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: false,
  error: null,
};

// Create authentication state instance
export const authState = createState<AuthState>(initialAuthState);

/**
 * Load authentication state from localStorage
 */
export function loadAuthState(): void {
  const stored = Storage.get<{ user: UserInfo; tokens: TokenData }>(STORAGE_KEY);

  if (stored && stored.tokens) {
    // Check if tokens are expired
    const now = Date.now();
    if (stored.tokens.expires_at > now) {
      authState.setState({
        isAuthenticated: true,
        user: stored.user,
        tokens: stored.tokens,
        loading: false,
        error: null,
      });
    } else {
      // Tokens expired, clear state
      clearAuthState();
    }
  }
}

/**
 * Save authentication state to localStorage
 */
export function saveAuthState(user: UserInfo, tokens: TokenData): void {
  Storage.set(STORAGE_KEY, { user, tokens });

  authState.setState({
    isAuthenticated: true,
    user,
    tokens,
    loading: false,
    error: null,
  });
}

/**
 * Clear authentication state
 */
export function clearAuthState(): void {
  Storage.remove(STORAGE_KEY);

  authState.setState({
    isAuthenticated: false,
    user: null,
    tokens: null,
    loading: false,
    error: null,
  });
}

/**
 * Set authentication loading state
 */
export function setAuthLoading(loading: boolean): void {
  authState.setState({ loading });
}

/**
 * Set authentication error
 */
export function setAuthError(error: string | null): void {
  authState.setState({ error, loading: false });
}

/**
 * Update user info
 */
export function updateUserInfo(user: Partial<UserInfo>): void {
  const current = authState.getState();
  if (current.user) {
    const updated = { ...current.user, ...user };
    authState.setState({ user: updated });

    // Update storage
    if (current.tokens) {
      Storage.set(STORAGE_KEY, { user: updated, tokens: current.tokens });
    }
  }
}

/**
 * Update tokens
 */
export function updateTokensInState(tokens: TokenData): void {
  const current = authState.getState();
  authState.setState({ tokens });

  // Update storage
  if (current.user) {
    Storage.set(STORAGE_KEY, { user: current.user, tokens });
  }
}

/**
 * Get current user info
 */
export function getUserInfo(): UserInfo | null {
  return authState.getState().user;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return authState.getState().isAuthenticated;
}

/**
 * Get current user
 */
export function getUserFromState(): UserInfo | null {
  return authState.getState().user;
}

/**
 * Get current tokens
 */
export function getTokensFromState(): TokenData | null {
  return authState.getState().tokens;
}

/**
 * Check if access token is expired or about to expire
 */
export function isTokenExpiredInState(bufferSeconds: number = 60): boolean {
  const tokens = getTokensFromState();
  if (!tokens) {
    return true;
  }

  const now = Date.now();
  const expiresAt = tokens.expires_at;

  // Check if token expires within buffer period
  return expiresAt <= now + (bufferSeconds * 1000);
}

