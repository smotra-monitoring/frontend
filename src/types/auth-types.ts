/**
 * Authentication type definitions
 * Extends the generated OpenAPI types with application-specific auth types
 */

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  tokens: TokenData | null;
  loading: boolean;
  error: string | null;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
  token_type: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export type OAuth2Provider = 'okta' | 'auth0' | 'azure' | 'google' | 'oidc';

export interface OAuth2Config {
  provider: OAuth2Provider;
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
  tokens?: TokenData;
  error?: string;
}

export interface AuthGuardResult {
  allowed: boolean;
  redirectTo?: string;
}
