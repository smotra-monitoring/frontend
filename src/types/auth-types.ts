/**
 * Authentication type definitions
 * Extends the generated OpenAPI types with application-specific auth types
 */

import type { TokenResponse } from '../api/index.js';

// Re-export the generated TokenResponse as the canonical token type
export type { TokenResponse };

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  tokens: TokenResponse | null;
  loading: boolean;
  error: string | null;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export type OAuth2Provider = 'okta' | 'auth0' | 'azure' | 'google' | 'oidc';

export interface OAuth2Config {
  clientId: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revokeEndpoint: string;
  userinfoEndpoint: string;
  logoutEndpoint: string;
  scopes: string[];
}

export interface PKCEChallenge {
  code_verifier: string;
  code_challenge: string;
  code_challenge_method: 'S256';
}

export interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: 'code';
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: 'S256';
}

export interface TokenRefreshResult {
  success: boolean;
  tokens?: TokenResponse;
  error?: string;
}

export interface AuthGuardResult {
  allowed: boolean;
  redirectTo?: string;
}
