/**
 * Tests for token management
 */

import {
    scheduleTokenRefresh,
    refreshAccessToken,
} from '../../../src/auth/token-manager.js';

/** Drain the microtask queue fully (handles chained async/await in mocked fetch).
 *  Cannot use process.nextTick here because jest.useFakeTimers() fakes it. */
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
} from '../../../src/state/auth-state.js';
import {
    storeTokens,
    clearTokens,
} from '../../helpers/token-helpers.js';
import { mockTokens, mockRefreshTokenResponse, mockFetchSuccess, mockFetchError } from '../../mocks/oauth-responses.js';

describe('token-manager', () => {
    beforeEach(() => {
        clearTokens();
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('isTokenExpired (auth-state)', () => {
        it('returns false for valid tokens', () => {
            storeTokens(mockTokens);

            expect(isTokenExpiredInState()).toBe(false);
        });

        it('returns true when no tokens stored', () => {
            expect(isTokenExpiredInState()).toBe(true);
        });

        it('returns true for expired tokens', () => {
            storeTokens(mockTokens);

            // Advance time past expiration
            jest.advanceTimersByTime(mockTokens.expires_at - Date.now() + 1000);
            expect(isTokenExpiredInState()).toBe(true);
        });

        it('returns true with buffer time before actual expiration', () => {
            storeTokens(mockTokens);

            // Advance to within buffer time (default 60 seconds)
            const bufferTime = 50 * 1000; // 50 seconds
            jest.advanceTimersByTime(mockTokens.expires_at - Date.now() - bufferTime);

            expect(isTokenExpiredInState()).toBe(true);
        });

        it('respects custom buffer time', () => {
            storeTokens(mockTokens);

            // Advance to within 2 minutes of expiration
            const twoMinutesBeforeExpiration = (mockTokens.expires_at - 2 * 60 * 1000) - Date.now();
            jest.advanceTimersByTime(twoMinutesBeforeExpiration);

            // Should be expired with 121 second buffer
            expect(isTokenExpiredInState(121)).toBe(true);

            // Should NOT be expired with 119 second buffer
            expect(isTokenExpiredInState(119)).toBe(false);
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
            mockFetchError(401, 'Unauthorized');

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

            updateTokensInState(mockTokens);
            const cleanup = scheduleTokenRefresh(getTokensFromState()!);

            // Fast-forward to refresh time (5 minutes before expiration)
            // jest.advanceTimersByTime((mockTokens.expires_in - 300) * 1000);
            const fiveMinutesBeforeExpiration = (mockTokens.expires_at - 5 * 60 * 1000) - Date.now();
            jest.advanceTimersByTime(fiveMinutesBeforeExpiration);

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

        it('invokes onRefreshComplete callback with new tokens after successful refresh', async () => {
            mockFetchSuccess(mockRefreshTokenResponse);
            updateTokensInState(mockTokens);

            const onRefreshComplete = jest.fn();
            const cleanup = scheduleTokenRefresh(getTokensFromState()!, onRefreshComplete);

            // Advance to the scheduled refresh time
            const fiveMinutesBeforeExpiration = (mockTokens.expires_at - 5 * 60 * 1000) - Date.now();
            jest.advanceTimersByTime(fiveMinutesBeforeExpiration);

            // Drain all pending microtasks from the fetch → json() → callback chain
            await flushPromises();

            expect(onRefreshComplete).toHaveBeenCalledTimes(1);
            expect(onRefreshComplete).toHaveBeenCalledWith(
                expect.objectContaining({ access_token: mockRefreshTokenResponse.access_token }),
            );

            cleanup();
        });

        it('does not invoke onRefreshComplete when refresh fails', async () => {
            mockFetchError(401, 'Unauthorized');
            updateTokensInState(mockTokens);

            const onRefreshComplete = jest.fn();
            const cleanup = scheduleTokenRefresh(getTokensFromState()!, onRefreshComplete);

            const fiveMinutesBeforeExpiration = (mockTokens.expires_at - 5 * 60 * 1000) - Date.now();
            jest.advanceTimersByTime(fiveMinutesBeforeExpiration);

            await flushPromises();

            expect(onRefreshComplete).not.toHaveBeenCalled();

            cleanup();
        });

        it('immediately refreshes and invokes callback when token is already expiring', async () => {
            mockFetchSuccess(mockRefreshTokenResponse);

            // Token that expires in less than the 5-minute buffer
            const expiringTokens = { ...mockTokens, expires_at: Date.now() + 2 * 60 * 1000 };
            updateTokensInState(expiringTokens);

            const onRefreshComplete = jest.fn();
            scheduleTokenRefresh(expiringTokens, onRefreshComplete);

            // Drain microtasks from the immediate .then() path
            await flushPromises();

            expect(fetch).toHaveBeenCalled();
            expect(onRefreshComplete).toHaveBeenCalledTimes(1);
        });
    });
});
