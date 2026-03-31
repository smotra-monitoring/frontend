/**
 * OAuth test helpers
 * Utilities for OAuth flows in test environments.
 * These helpers expose the cryptographic primitives and HTTP operations needed
 * by integration tests, without polluting the production module's public API.
 */

import { TextEncoder, TextDecoder } from 'util';

// Ensure TextEncoder/TextDecoder are available in the jsdom test environment
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

/**
 * Generate PKCE code verifier (base64url-encoded random 32 bytes)
 */
export function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const base64 = btoa(String.fromCharCode(...array));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Generate PKCE code challenge (SHA-256 of verifier, base64url-encoded)
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Generate random state parameter (64-char hex string)
 */
export function generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Build an OAuth2 authorization URL deterministically from supplied parameters.
 * No side effects — does not store PKCE or state.
 */
export function buildAuthorizationUrl(
    config: { authorizationEndpoint: string; clientId: string; redirectUri: string; scopes: string[] },
    codeChallenge: string,
    state: string
): string {
    const url = new URL(config.authorizationEndpoint);
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', config.scopes.join(' '));
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);
    return url.toString();
}

/**
 * Exchange an authorization code for tokens.
 * Requires a mocked `fetch` in the test environment.
 */
export async function exchangeCodeForTokens(
    config: { tokenEndpoint: string; clientId: string; redirectUri: string },
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${errorData.error || response.statusText}`);
    }

    return response.json();
}
