/**
 * Tests for authentication guards
 */

import { canAccessRoute_ForTest, protectRoute } from '../../../src/auth/auth-guard.js';
import { saveAuthState, clearAuthState } from '../../../src/state/auth-state.js';
import { mockFetchSuccess, mockTokens, mockUserInfo } from '../../mocks/oauth-responses.js';
import { navigateTo } from '../../../src/utils/navigation.js';

jest.mock('../../../src/utils/navigation.js', () => ({
    navigateTo: jest.fn().mockResolvedValue(undefined),
    registerNavigate: jest.fn(),
}));

const mockNavigateTo = navigateTo as jest.MockedFunction<typeof navigateTo>;

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
            saveAuthState(mockUserInfo, mockTokens);

            const result = await canAccessRoute_ForTest(true);
            expect(result.allowed).toBe(true);
        });

        it('denies access when token is expired', async () => {
            const expiredTokens = {
                ...mockTokens,
                expires_at: Date.now() - 1000, // Expired in the past
            };
            saveAuthState(mockUserInfo, expiredTokens);

            const result = await canAccessRoute_ForTest(true);
            expect(result.allowed).toBe(false);
            expect(result.redirectTo).toBe('/login');
        });

        it('attempts token refresh for expired tokens', async () => {
            mockFetchSuccess(mockTokens); // Mock successful refresh response

            const almostExpiredTokens = {
                ...mockTokens,
                expires_at: Date.now() + 60 * 1000, // Expires in 1 minute (within default buffer time)
            };
            saveAuthState(mockUserInfo, almostExpiredTokens);

            const result = await canAccessRoute_ForTest(true);
            // Should allow access after successful refresh
            expect(result.allowed).toBe(true);
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
    });
});
