/**
 * Tests for authentication guards
 */

import { vi, type Mock, type MockedFunction } from 'vitest';
import type { TokenResponse } from '../../../src/types/auth-types.js';

vi.mock('../../../src/api/index.js', () => ({
    authRefresh: vi.fn(),
    oauth2Revoke: vi.fn(),
}));

import { authRefresh } from '../../../src/api/index.js';

import {
    canAccessRoute_ForTest,
    protectRoute,
    canAccessPublicOnlyRoute,
    getRedirectAfterLogin,
    withAuthGuard,
} from '../../../src/auth/auth-guard.js';
import { saveAuthState, clearAuthState } from '../../../src/state/auth-state.js';
import { mockToken, mockUserInfo } from '../../mocks/oauth-responses.js';
import { navigateTo } from '../../../src/utils/navigation.js';

vi.mock('../../../src/utils/navigation.js', () => ({
    navigateTo: vi.fn().mockResolvedValue(undefined),
    registerNavigate: vi.fn(),
}));

const mockNavigateTo = navigateTo as MockedFunction<typeof navigateTo>;

describe('auth-guard', () => {
    beforeEach(() => {
        clearAuthState();
        mockNavigateTo.mockClear();
    });

    describe('canAccessRoute', () => {
        it('allows access when not requiring auth', async () => {
            const result = await canAccessRoute_ForTest(false);
            expect(result.allowed).toBe(true);
        });

        it('denies access when requiring auth but not authenticated', async () => {
            const result = await canAccessRoute_ForTest(true);
            expect(result.allowed).toBe(false);
            expect(result.redirectTo).toBe('/login');
        });

        it('allows access when authenticated with valid token', async () => {
            // Set up authenticated state
            saveAuthState(mockUserInfo, mockToken);

            const result = await canAccessRoute_ForTest(true);
            expect(result.allowed).toBe(true);
        });

        it('denies access when token is expired', async () => {
            const expiredTokens: TokenResponse = {
                ...mockToken,
                expires_at: new Date(Date.now() - 1000), // Expired in the past
            };
            saveAuthState(mockUserInfo, expiredTokens);

            const result = await canAccessRoute_ForTest(true);
            expect(result.allowed).toBe(false);
            expect(result.redirectTo).toBe('/login');
        });

        it('attempts token refresh for expired tokens', async () => {
            // Mock the authRefresh SDK to return refreshed tokens
            const refreshedTokens: TokenResponse = {
                ...mockToken,
                opaque_token: 'st_live_refreshed_token',
                expires_at: new Date(Date.now() + 3600 * 1000),
            };
            (authRefresh as Mock).mockResolvedValue({ data: refreshedTokens, error: null });

            const almostExpiredTokens: TokenResponse = {
                ...mockToken,
                expires_at: new Date(Date.now() + 59 * 1000), // Expires in 1 minute (within default buffer time)
            };
            saveAuthState(mockUserInfo, almostExpiredTokens);

            const result = await canAccessRoute_ForTest(true);
            // Should allow access after successful refresh
            expect(result.allowed).toBe(true);
            expect(authRefresh).toHaveBeenCalled();
        });
    });

    describe('protectRoute', () => {
        it('redirects to login with return URL', async () => {
            const currentPath = '/dashboard';
            await protectRoute(currentPath);

            expect(mockNavigateTo).toHaveBeenCalledWith('/login', 'replace');
            expect(sessionStorage.getItem('redirect_after_login')).toContain(`${currentPath}`);
        });

        it('stores return URL in sessionStorage', async () => {
            const currentPath = '/dashboard/settings';
            await protectRoute(currentPath);

            const stored = sessionStorage.getItem('redirect_after_login');
            expect(stored).toBe(currentPath);
        });

        it('handles paths with query parameters', async () => {
            const currentPath = '/dashboard?filter=active&sort=name';
            await protectRoute(currentPath);

            const stored = sessionStorage.getItem('redirect_after_login');
            expect(stored).toBe(currentPath);
        });

        it('returns true and does not redirect when authenticated', async () => {
            saveAuthState(mockUserInfo, mockToken);

            expect(await protectRoute('/dashboard')).toBe(true);
            expect(mockNavigateTo).not.toHaveBeenCalled();
        });
    });

    describe('canAccessPublicRoute', () => {
        it('allows unauthenticated users', () => {
            expect(canAccessPublicOnlyRoute()).toEqual({ allowed: true });
        });

        it('redirects authenticated users to the dashboard', () => {
            saveAuthState(mockUserInfo, mockToken);

            expect(canAccessPublicOnlyRoute()).toEqual({ allowed: false, redirectTo: '/dashboard' });
        });
    });

    describe('getRedirectAfterLogin', () => {
        it('returns the stored path and clears it', () => {
            sessionStorage.setItem('redirect_after_login', '/agent');

            expect(getRedirectAfterLogin()).toBe('/agent');
            expect(sessionStorage.getItem('redirect_after_login')).toBeNull();
        });

        it('returns null when nothing is stored', () => {
            expect(getRedirectAfterLogin()).toBeNull();
        });
    });

    describe('withAuthGuard', () => {
        it('runs the handler when access is allowed', async () => {
            saveAuthState(mockUserInfo, mockToken);
            const handler = vi.fn();

            await withAuthGuard(handler)();

            expect(handler).toHaveBeenCalled();
            expect(mockNavigateTo).not.toHaveBeenCalled();
        });

        it('redirects to login without running the handler when denied', async () => {
            const handler = vi.fn();

            await withAuthGuard(handler)();

            expect(handler).not.toHaveBeenCalled();
            expect(mockNavigateTo).toHaveBeenCalledWith('/login', 'replace');
        });

        it('runs the handler without auth when requireAuth is false', async () => {
            const handler = vi.fn();

            await withAuthGuard(handler, false)();

            expect(handler).toHaveBeenCalled();
        });
    });
});
