/**
 * OAuth2 manager with PKCE support
 * Handles OAuth authorization flow with multiple providers
 */

import type { OAuth2Config, OAuth2Provider, PKCEChallenge } from '../types/auth-types.js';
import { Storage } from '../utils/storage.js';
import { buildUrl, parseOAuthCallback } from '../utils/url-utils.js';

const PKCE_STORAGE_KEY = 'oauth_pkce';
const STATE_STORAGE_KEY = 'oauth_state';

/**
 * Generate random string for code verifier
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate PKCE code verifier (base64url encoded random string)
 */
export const generateCodeVerifier_ForTests = generateCodeVerifier;
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...array));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate PKCE code challenge from verifier
 */
export const generateCodeChallenge_ForTests = generateCodeChallenge;
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate random state parameter for CSRF protection
 */
export function generateState_ForTests(): string {
  return generateRandomString(32);
}

/**
 * Generate PKCE challenge pair
 */
async function generateAndStorePKCEChallenge(): Promise<PKCEChallenge> {
  const code_verifier = generateCodeVerifier();
  const code_challenge = await generateCodeChallenge(code_verifier);

  const pkce: PKCEChallenge = {
    code_verifier,
    code_challenge,
    code_challenge_method: 'S256',
  };

  storePKCE(pkce);

  return pkce;
}

/**
 * Store PKCE challenge for later verification
 */
function storePKCE(pkce: PKCEChallenge): void {
  Storage.set(PKCE_STORAGE_KEY, pkce);
}

/**
 * Retrieve and remove stored PKCE challenge
 */
export function retrievePKCE(): PKCEChallenge | null {
  const pkce = Storage.get<PKCEChallenge>(PKCE_STORAGE_KEY);
  Storage.remove(PKCE_STORAGE_KEY);
  return pkce;
}

/**
 * Generate and store random state parameter for CSRF protection
 */
function generateAndStoreState(): string {
  const state = generateRandomString(32);
  Storage.set(STATE_STORAGE_KEY, state);
  return state;
}

/**
 * Retrieve and remove stored state
 */
function retrieveState(): string | null {
  const state = Storage.get<string>(STATE_STORAGE_KEY);
  Storage.remove(STATE_STORAGE_KEY);
  return state;
}

/**
 * Validate OAuth callback state parameter
 */
function validateState(receivedState: string): boolean {
  const storedState = retrieveState();
  return storedState === receivedState;
}

/**
 * Build authorization URL with PKCE parameters
 * This funcion is for testing purposes to mock buildFullAuthorizationUrl without generating PKCE and state, 
 * which are random and cannot be easily tested. 
 * In production, buildFullAuthorizationUrl should be used, which generates PKCE and state internally.
 */
export function buildAuthorizationUrl_ForTests(
  config: OAuth2Config | { authorizationEndpoint: string; clientId: string; redirectUri: string; scopes: string[] },
  codeChallenge: string,
  state: string
): string {
  const params = {
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  };

  return buildUrl(config.authorizationEndpoint, params);
}

/**
 * Build full authorization URL for OAuth2 flow (with PKCE generation)
 */
async function buildAuthorizationUrl(config: OAuth2Config): Promise<string> {
  // Generate PKCE challenge
  const pkce = await generateAndStorePKCEChallenge();

  // Generate state
  const state = generateAndStoreState();

  // Build authorization request parameters
  const params: Record<string, string> = {
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    code_challenge: pkce.code_challenge,
    code_challenge_method: pkce.code_challenge_method,
  };

  return buildUrl(config.authorizationEndpoint, params);
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens_ForTests(
  config: OAuth2Config | { tokenEndpoint: string; clientId: string; redirectUri: string },
  authorizationCode: string,
  codeVerifier: string
): Promise<{ access_token: string; refresh_token?: string; token_type: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${errorData.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Initiate OAuth2 authorization flow
 */
export async function initiateOAuthFlow(config: OAuth2Config): Promise<void> {
  const authUrl = await buildAuthorizationUrl(config);
  window.location.href = authUrl;
}

/**
 * Handle OAuth2 callback
 */
export function handleOAuthCallback(): {
  code: string | null;
  error: string | null;
  valid: boolean;
} {
  const callbackParams = parseOAuthCallback(window.location.href);

  // Check for error
  if (callbackParams.error) {
    return {
      code: null,
      error: callbackParams.error_description || callbackParams.error,
      valid: false,
    };
  }

  // Validate state (CSRF protection)
  if (!callbackParams.state || !validateState(callbackParams.state)) {
    return {
      code: null,
      error: 'Invalid state parameter. Possible CSRF attack.',
      valid: false,
    };
  }

  // Check for authorization code
  if (!callbackParams.code) {
    return {
      code: null,
      error: 'No authorization code received',
      valid: false,
    };
  }

  return {
    code: callbackParams.code,
    error: null,
    valid: true,
  };
}

/**
 * Get OAuth2 provider configuration
 * In production, these would come from environment variables
 */
export function getProviderConfig(provider: OAuth2Provider): Partial<OAuth2Config> {
  // These are example configurations - should be loaded from environment
  const configs: Record<OAuth2Provider, Partial<OAuth2Config>> = {
    okta: {
      authorizationEndpoint: 'https://your-domain.okta.com/oauth2/v1/authorize',
      tokenEndpoint: 'https://your-domain.okta.com/oauth2/v1/token',
      scopes: ['openid', 'profile', 'email'],
    },
    auth0: {
      authorizationEndpoint: 'https://your-domain.auth0.com/authorize',
      tokenEndpoint: 'https://your-domain.auth0.com/oauth/token',
      scopes: ['openid', 'profile', 'email'],
    },
    azure: {
      authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: ['openid', 'profile', 'email'],
    },
    google: {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      scopes: ['openid', 'profile', 'email'],
    },
    oidc: {
      // Generic OIDC - endpoints should be discovered from .well-known/openid-configuration
      authorizationEndpoint: '',
      tokenEndpoint: '',
      scopes: ['openid', 'profile', 'email'],
    },
  };

  return configs[provider];
}
