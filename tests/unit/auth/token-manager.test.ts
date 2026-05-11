/**
 * Tests for token management
 */

import {
    scheduleTokenRefresh,
    refreshAccessToken,
} from '../../../src/auth/token-manager.js';

import { vi, type Mock } from 'vitest';

/** Drain the microtask queue fully (handles chained async/await in mocked fetch).
 *  Cannot use process.nextTick here because vi.useFakeTimers() fakes it. */
const flushPromises = async () => {
    // 4 rounds covers: await fetch → await json() → refreshAccessToken resolves → .then/.await callback
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
};
import {
    getTokensFromState,
    updateTokensInState,
    isTokenExpiredInState,
    clearAuthState,
} from '../../../src/state/auth-state.js';
import { mockTokens, mockRefreshTokenResponse, mockFetchSuccess, mockFetchError } from '../../mocks/oauth-responses.js';

describe('token-manager', () => {
    beforeEach(() => {
        clearAuthState();
        vi.clearAllTimers();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('isTokenExpired (auth-state)', () => {
        it('returns false for valid tokens', () => {
            updateTokensInState(mockTokens);

            expect(isTokenExpiredInState()).toBe(false);
        });

        it('returns true when no tokens stored', () => {
            expect(isTokenExpiredInState()).toBe(true);
        });

        it('returns true for expired tokens', () => {
            updateTokensInState(mockTokens);

            // Advance time past expiration
            vi.advanceTimersByTime(mockTokens.expires_at - Date.now() + 1000);
            expect(isTokenExpiredInState()).toBe(true);
        });

        it('returns true with buffer time before actual expiration', () => {
            updateTokensInState(mockTokens);

            // Advance to within buffer time (default 60 seconds)
            const bufferTime = 50 * 1000; // 50 seconds
            vi.advanceTimersByTime(mockTokens.expires_at - Date.now() - bufferTime);

            expect(isTokenExpiredInState()).toBe(true);
        });

        it('respects custom buffer time', () => {
            updateTokensInState(mockTokens);

            // Advance to within 2 minutes of expiration
            const twoMinutesBeforeExpiration = (mockTokens.expires_at - 2 * 60 * 1000) - Date.now();
            vi.advanceTimersByTime(twoMinutesBeforeExpiration);

            // Should be expired with 121 second buffer
            expect(isTokenExpiredInState(121)).toBe(true);

            // Should NOT be expired with 119 second buffer
            expect(isTokenExpiredInState(119)).toBe(false);
        });
    });

    describe('refreshAccessToken', () => {
        it('refreshes access token using refresh token', async () => {
            updateTokensInState(mockTokens);
            mockFetchSuccess(mockRefreshTokenResponse);

            const result = await refreshAccessToken();

            expect(result.success).toBe(true);
            expect(result.tokens?.access_token).toBe(mockRefreshTokenResponse.access_token);
            const [url, options] = (fetch as Mock).mock.calls[0] as [string, RequestInit];
            expect(url).toContain('/token');
            expect(options.method).toBe('POST');
            expect(options.headers).toMatchObject({ 'Content-Type': 'application/x-www-form-urlencoded' });
            expect(options.body).toBeInstanceOf(URLSearchParams);
            expect((options.body as URLSearchParams).get('grant_type')).toBe('refresh_token');
            expect((options.body as URLSearchParams).get('refresh_token')).toBeTruthy();
        });

        it('throws error on failed refresh', async () => {
            updateTokensInState(mockTokens);
            mockFetchError(401, 'Unauthorized');

            const result = await refreshAccessToken();

            expect(result.success).toBe(false);
        });
    });

    describe('scheduleTokenRefresh', () => {
        it('schedules refresh before token expiration', () => {
            const cleanup = scheduleTokenRefresh(mockTokens);

            // Timer should be scheduled
            expect(vi.getTimerCount()).toBeGreaterThan(0);

            cleanup();
        });

        it('calls refresh function at scheduled time', async () => {
            mockFetchSuccess(mockRefreshTokenResponse);

            updateTokensInState(mockTokens);
            const cleanup = scheduleTokenRefresh(getTokensFromState()!);

            // Fast-forward to refresh time (5 minutes before expiration)
            // vi.advanceTimersByTime((mockTokens.expires_in - 300) * 1000);
            const fiveMinutesBeforeExpiration = (mockTokens.expires_at - 5 * 60 * 1000) - Date.now();
            vi.advanceTimersByTime(fiveMinutesBeforeExpiration);

            // Wait for async operations
            await Promise.resolve();

            // Should have made refresh request
            expect(fetch).toHaveBeenCalled();

            cleanup();
        });

        it('cleanup function cancels scheduled refresh', () => {
            const cleanup = scheduleTokenRefresh(mockTokens);
            const timerCount = vi.getTimerCount();

            cleanup();

            expect(vi.getTimerCount()).toBeLessThan(timerCount);
        });

        it('invokes onRefreshComplete callback with new tokens after successful refresh', async () => {
            mockFetchSuccess(mockRefreshTokenResponse);
            updateTokensInState(mockTokens);

            const onRefreshComplete = vi.fn();
            const cleanup = scheduleTokenRefresh(getTokensFromState()!, onRefreshComplete);

            // Advance to the scheduled refresh time
            const fiveMinutesBeforeExpiration = (mockTokens.expires_at - 5 * 60 * 1000) - Date.now();
            vi.advanceTimersByTime(fiveMinutesBeforeExpiration);

            // Drain all pending microtasks from the fetch → json() → callback chain
            await flushPromises();

            expect(fetch).toHaveBeenCalled();
            expect(onRefreshComplete).toHaveBeenCalledTimes(1);
            expect(onRefreshComplete).toHaveBeenCalledWith(
                expect.objectContaining({ access_token: mockRefreshTokenResponse.access_token }),
            );

            cleanup();
        });

        it('does not invoke onRefreshComplete when refresh fails', async () => {
            mockFetchError(401, 'Unauthorized');
            updateTokensInState(mockTokens);

            const onRefreshComplete = vi.fn();
            const cleanup = scheduleTokenRefresh(getTokensFromState()!, onRefreshComplete);

            const fiveMinutesBeforeExpiration = (mockTokens.expires_at - 5 * 60 * 1000) - Date.now();
            vi.advanceTimersByTime(fiveMinutesBeforeExpiration);

            await flushPromises();

            expect(onRefreshComplete).not.toHaveBeenCalled();

            cleanup();
        });

        it('immediately refreshes and invokes callback when token is already expiring', async () => {
            mockFetchSuccess(mockRefreshTokenResponse);

            // Token that expires in less than the 5-minute buffer
            const expiringTokens = { ...mockTokens, expires_at: Date.now() + 2 * 60 * 1000 };
            updateTokensInState(expiringTokens);

            const onRefreshComplete = vi.fn();
            scheduleTokenRefresh(expiringTokens, onRefreshComplete);

            // Drain microtasks from the immediate .then() path
            await flushPromises();

            expect(fetch).toHaveBeenCalled();
            expect(onRefreshComplete).toHaveBeenCalledTimes(1);
        });
    });
});
