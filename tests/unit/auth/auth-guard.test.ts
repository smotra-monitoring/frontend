/**
 * Tests for authentication guards
 */

import { canAccessRoute, protectRoute } from '../../../src/auth/auth-guard.js';
import { storeTokens, clearTokens } from '../../../src/auth/token-manager.js';
import { saveAuthState, clearAuthState } from '../../../src/state/auth-state.js';
import { mockTokens, mockUserInfo } from '../../mocks/oauth-responses.js';

describe('auth-guard', () => {
    beforeEach(() => {
        clearTokens();
        clearAuthState();
        delete (window as any).location;
        (window as any).location = { href: '' };
    });

    describe('canAccessRoute', () => {
        it('allows access when not requiring auth', async () => {
            const result = await canAccessRoute(false);
            expect(result.allowed).toBe(true);
        });

        it('denies access when requiring auth but not authenticated', async () => {
            const result = await canAccessRoute(true);
            expect(result.allowed).toBe(false);
            expect(result.redirectTo).toBe('/login');
        });

        it('allows access when authenticated with valid token', async () => {
            // Set up authenticated state
            storeTokens(mockTokens);
            saveAuthState(mockUserInfo, mockTokens);

            const result = await canAccessRoute(true);
            expect(result.allowed).toBe(true);
        });

        it('denies access when token is expired', async () => {
            const expiredTokens = {
                ...mockTokens,
                expires_in: -1, // Expired
            };
            storeTokens(expiredTokens);
            saveAuthState(mockUserInfo, expiredTokens);

            const result = await canAccessRoute(true);
            expect(result.allowed).toBe(false);
            expect(result.redirectTo).toBe('/login');
        });

        it('attempts token refresh for expired tokens', async () => {
            const almostExpiredTokens = {
                ...mockTokens,
                expires_in: 100, // Expires soon
            };
            storeTokens(almostExpiredTokens);
            saveAuthState(mockUserInfo, almostExpiredTokens);

            // Mock refresh endpoint
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: async () => ({
                        access_token: 'new-token',
                        token_type: 'Bearer',
                        expires_in: 3600,
                    }),
                } as Response)
            );

            const result = await canAccessRoute(true);
            // Should allow access after successful refresh
            expect(result.allowed).toBe(true);
        });
    });

    describe('protectRoute', () => {
        it('redirects to login with return URL', () => {
            const currentPath = '/dashboard';
            protectRoute(currentPath);

            expect(window.location.href).toContain('/login');
            expect(window.location.href).toContain(`return=${encodeURIComponent(currentPath)}`);
        });

        it('stores return URL in localStorage', () => {
            const currentPath = '/dashboard/settings';
            protectRoute(currentPath);

            const stored = localStorage.getItem('auth_return_url');
            expect(stored).toBe(currentPath);
        });

        it('handles paths with query parameters', () => {
            const currentPath = '/dashboard?filter=active&sort=name';
            protectRoute(currentPath);

            const stored = localStorage.getItem('auth_return_url');
            expect(stored).toBe(currentPath);
        });
    });
});
