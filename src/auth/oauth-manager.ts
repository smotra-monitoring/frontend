/**
 * OAuth2 manager with PKCE support
 * Handles OAuth authorization flow with multiple providers
 */

import { getEnvironmentConfig } from '../config.js';
import type { OAuth2Config, OAuth2Provider, PKCEChallenge } from '../types/auth-types.js';
import { Storage } from '../utils/storage.js';
import { buildUrl, parseOAuthCallback } from '../utils/url-utils.js';

const PKCE_STORAGE_KEY = 'oauth_pkce';
const STATE_STORAGE_KEY = 'oauth_state';
const OAUTH_PROVIDER_STORAGE_KEY = 'oauth_provider';

const providers_config: Record<OAuth2Provider, OAuth2Config> = {
  okta: {
    provider: "okta",
    scopes: ['openid', 'profile', 'email'],
    authorizationEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/authorize',
    tokenEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/token',
    revokeEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/revoke',
    userinfoEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/userinfo',
    logoutEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/logout',
    redirectUri: `defined on the server`,
    clientId: 'defined on the server',
  },
  auth0: {
    provider: "auth0",
    scopes: ['openid', 'profile', 'email'],
    authorizationEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/authorize',
    tokenEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/token',
    revokeEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/revoke',
    userinfoEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/userinfo',
    logoutEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/logout',
    redirectUri: `defined on the server`,
    clientId: 'defined on the server',
  },
  azure: {
    provider: "azure",
    scopes: ['openid', 'profile', 'email'],
    authorizationEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/authorize',
    tokenEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/token',
    revokeEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/revoke',
    userinfoEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/userinfo',
    logoutEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/logout',
    redirectUri: `defined on the server`,
    clientId: 'defined on the server',
  },
  google: {
    provider: "google",
    scopes: ['openid', 'profile', 'email'],
    authorizationEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/authorize',
    tokenEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/token',
    revokeEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/revoke',
    userinfoEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/userinfo',
    logoutEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/logout',
    redirectUri: `defined on the server`,
    clientId: 'defined on the server',
  },
  oidc: {
    // Generic OIDC - endpoints should be discovered from .well-known/openid-configuration
    provider: "oidc",
    scopes: ['openid', 'profile', 'email'],
    authorizationEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/authorize',
    tokenEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/token',
    revokeEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/oauth2/revoke',
    userinfoEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/userinfo',
    logoutEndpoint: getEnvironmentConfig().apiBaseUrl + '/auth/logout',
    redirectUri: `defined on the server`,
    clientId: 'defined on the server',
  },
};


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
 * Generate random state parameter for CSRF protection
 */
function generateState(): string {
  return generateRandomString(32);
}

/**
 * Generate and store random state parameter for CSRF protection
 */
function generateAndStoreState(): string {
  const state = generateState();
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

function storeAuthenticationProvider(provider: OAuth2Provider): void {
  Storage.set(OAUTH_PROVIDER_STORAGE_KEY, provider);
}

export function retrieveAuthenticationProvider(): OAuth2Provider | null {
  const provider = Storage.get<OAuth2Provider>(OAUTH_PROVIDER_STORAGE_KEY);
  Storage.remove(OAUTH_PROVIDER_STORAGE_KEY);
  return provider;
}

/**
 * Build full authorization URL for OAuth2 flow (with PKCE generation)
 */
async function buildAuthorizationUrl(config: OAuth2Config): Promise<string> {
  // Generate PKCE challenge
  const pkce = await generateAndStorePKCEChallenge();

  // Generate state
  const state = generateAndStoreState();

  storeAuthenticationProvider(config.provider);

  // Build authorization request parameters
  const params: Record<string, string> = {
    provider: config.provider,
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
    console.error('OAuth callback error:', callbackParams.error, callbackParams.error_description);
    return {
      code: null,
      error: callbackParams.error_description || callbackParams.error,
      valid: false,
    };
  }

  // Validate state (CSRF protection)
  if (!callbackParams.state || !validateState(callbackParams.state)) {
    console.error('Invalid state parameter in OAuth callback. Possible CSRF attack. (Received:', callbackParams.state, ')');
    return {
      code: null,
      error: 'Invalid state parameter. Possible CSRF attack.',
      valid: false,
    };
  }

  // Check for authorization code
  if (!callbackParams.code) {
    console.error('No authorization code found in OAuth callback.');
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
export function getProviderConfig(provider: OAuth2Provider): OAuth2Config {
  return providers_config[provider];
}
