/**
 * Authentication state management
 */

import { createState } from './global-state.js';
import type { AuthState, UserInfo, TokenResponse } from '../types/auth-types.js';
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
const authState = createState<AuthState>(initialAuthState);

/**
 * Load authentication state from localStorage
 */
export function loadAuthState(): void {
  // expires_at is serialized as an ISO string in JSON; reconstruct as Date
  const stored = Storage.get<{ user: UserInfo; tokens: TokenResponse }>(STORAGE_KEY);

  if (stored && stored.tokens) {

    if (Date.now() < new Date(stored.tokens.expires_at).getTime()) {
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
export function saveAuthState(user: UserInfo, tokens: TokenResponse): void {
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
export function updateTokensInState(tokens: TokenResponse): void {
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
export function getTokensFromState(): TokenResponse | null {
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

  // Use new Date(...) to safely handle both Date objects and ISO strings (e.g. after localStorage round-trip)
  const expiresAt = new Date(tokens.expires_at).getTime();

  // Check if token expires within buffer period
  return expiresAt <= Date.now() + (bufferSeconds * 1000);
}

