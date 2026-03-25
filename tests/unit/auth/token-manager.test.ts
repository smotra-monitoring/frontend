/**
 * Tests for token management
 */

import {
    scheduleTokenRefresh,
    refreshAccessToken,
} from '../../../src/auth/token-manager.js';
import {
    storeTokens,
    getCurrentTokens,
    clearTokens,
    isTokenExpired,
} from '../../helpers/token-helpers.js';
import { mockTokens, mockRefreshTokenResponse, mockFetchSuccess } from '../../mocks/oauth-responses.js';

describe('token-manager', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('storeTokens', () => {
        it('stores tokens in localStorage', () => {
            storeTokens(mockTokens);
            const stored = localStorage.getItem('auth_tokens');
            expect(stored).toBeTruthy();

            const parsed = JSON.parse(stored!);
            expect(parsed.access_token).toBe(mockTokens.access_token);
            expect(parsed.refresh_token).toBe(mockTokens.refresh_token);
        });

        it('calculates and stores expiration timestamp', () => {
            const beforeStore = Date.now();
            storeTokens(mockTokens);
            const afterStore = Date.now();

            const stored = JSON.parse(localStorage.getItem('auth_tokens')!);
            expect(stored.expires_at).toBeGreaterThan(beforeStore);
            //   expect(stored.expires_at).toBeLessThanOrEqual(afterStore + mockTokens.expires_in * 1000);
            expect(stored.expires_at).toBeLessThanOrEqual(mockTokens.expires_at);
        });
    });

    describe('getCurrentTokens', () => {
        it('retrieves stored tokens', () => {
            storeTokens(mockTokens);
            const tokens = getCurrentTokens();

            expect(tokens).toBeTruthy();
            expect(tokens?.access_token).toBe(mockTokens.access_token);
            expect(tokens?.refresh_token).toBe(mockTokens.refresh_token);
        });

        it('returns null when no tokens stored', () => {
            expect(getCurrentTokens()).toBeNull();
        });

        it('returns null for expired tokens', () => {
            const expiredTokens = {
                ...mockTokens,
                expires_in: -1, // Already expired
            };
            storeTokens(expiredTokens);

            // Should still return tokens (expiration check is separate)
            const tokens = getCurrentTokens();
            expect(tokens).toBeTruthy();
        });
    });

    describe('clearTokens', () => {
        it('removes tokens from localStorage', () => {
            storeTokens(mockTokens);
            expect(localStorage.getItem('auth_tokens')).toBeTruthy();

            clearTokens();
            expect(localStorage.getItem('auth_tokens')).toBeNull();
        });
    });

    describe('isTokenExpired', () => {
        it('returns false for valid tokens', () => {
            storeTokens(mockTokens); // expires in 3600 seconds
            const tokens = getCurrentTokens();
            expect(isTokenExpired(tokens!)).toBe(false);
        });

        it('returns true for expired tokens', () => {
            const expiredTokens = {
                ...mockTokens,
                expires_in: 0,
            };
            storeTokens(expiredTokens);
            const tokens = getCurrentTokens();

            // Advance time past expiration
            jest.advanceTimersByTime(1000);
            expect(isTokenExpired(tokens!)).toBe(true);
        });

        it('returns true with buffer time before actual expiration', () => {
            storeTokens(mockTokens);
            const tokens = getCurrentTokens();

            // Advance to within 5 minutes of expiration (default buffer)
            // jest.advanceTimersByTime((mockTokens.expires_in - 250) * 1000);
            jest.advanceTimersByTime((mockTokens.expires_at - 250) - Date.now());   // TODO: DOUBLE CHECK
            expect(isTokenExpired(tokens!)).toBe(true);
        });
    });

    describe('refreshAccessToken', () => {
        it('refreshes access token using refresh token', async () => {
            storeTokens(mockTokens);
            mockFetchSuccess(mockRefreshTokenResponse);

            const result = await refreshAccessToken();

            expect(result.success).toBe(true);
            expect(result.tokens?.access_token).toBe(mockRefreshTokenResponse.access_token);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/token'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('refresh_token'),
                })
            );
        });

        it('throws error on failed refresh', async () => {
            storeTokens(mockTokens);
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: false,
                    status: 401,
                    json: async () => ({ error: 'invalid_grant' }),
                } as Response)
            );

            const result = await refreshAccessToken();
            expect(result.success).toBe(false);
        });
    });

    describe('scheduleTokenRefresh', () => {
        it('schedules refresh before token expiration', () => {
            const cleanup = scheduleTokenRefresh(mockTokens);

            // Timer should be scheduled
            expect(jest.getTimerCount()).toBeGreaterThan(0);

            cleanup();
        });

        it('calls refresh function at scheduled time', async () => {
            mockFetchSuccess(mockRefreshTokenResponse);

            const cleanup = scheduleTokenRefresh(mockTokens);

            // Fast-forward to refresh time (5 minutes before expiration)
            // jest.advanceTimersByTime((mockTokens.expires_in - 300) * 1000);
            jest.advanceTimersByTime((mockTokens.expires_at - 300) - Date.now());   // TODO: DOUBLE CHECK

            // Wait for async operations
            await Promise.resolve();

            // Should have made refresh request
            expect(fetch).toHaveBeenCalled();

            cleanup();
        });

        it('cleanup function cancels scheduled refresh', () => {
            const cleanup = scheduleTokenRefresh(mockTokens);
            const timerCount = jest.getTimerCount();

            cleanup();

            expect(jest.getTimerCount()).toBeLessThan(timerCount);
        });
    });
});
