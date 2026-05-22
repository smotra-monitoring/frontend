/**
 * Tests for token management
 */

import {
    scheduleTokenRefresh,
    refreshAccessToken,
    revokeTokens,
} from '../../../src/auth/token-manager.js';

import { vi, type Mock } from 'vitest';
import type { TokenResponse } from '../../../src/api/index.js';

/** Drain the microtask queue fully (handles chained async/await in mocked SDK calls). */
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
import { mockToken } from '../../mocks/oauth-responses.js';
import { authRefresh, oauth2Revoke } from '../../../src/api/index.js';

vi.mock('../../../src/api/index.js', () => ({
    authRefresh: vi.fn(),
    oauth2Revoke: vi.fn(),
}));

const REFRESHED_TOKEN: TokenResponse = {
    opaque_token: 'st_live_refreshed_token_xyz789',
    absolute_expires_at: new Date(Date.now() + 7200 * 1000),
};

describe('token-manager', () => {
    beforeEach(() => {
        clearAuthState();
        vi.clearAllMocks();
        vi.clearAllTimers();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('isTokenExpired (auth-state)', () => {
        it('returns false for valid tokens', () => {
            updateTokensInState(mockToken);

            expect(isTokenExpiredInState()).toBe(false);
        });

        it('returns true when no tokens stored', () => {
            expect(isTokenExpiredInState()).toBe(true);
        });

        it('returns true for expired tokens', () => {
            updateTokensInState(mockToken);

            // Advance time past expiration
            vi.advanceTimersByTime(mockToken.absolute_expires_at.getTime() - Date.now() + 1000);
            expect(isTokenExpiredInState()).toBe(true);
        });

        it('returns true with buffer time before actual expiration', () => {
            updateTokensInState(mockToken);

            // Advance to within buffer time (default 60 seconds)
            const bufferTime = 50 * 1000; // 50 seconds before expiry
            vi.advanceTimersByTime(mockToken.absolute_expires_at.getTime() - Date.now() - bufferTime);

            expect(isTokenExpiredInState()).toBe(true);
        });

        it('respects custom buffer time', () => {
            updateTokensInState(mockToken);

            // Advance to within 2 minutes of expiration
            const twoMinutesBeforeExpiration = mockToken.absolute_expires_at.getTime() - 2 * 60 * 1000 - Date.now();
            vi.advanceTimersByTime(twoMinutesBeforeExpiration);

            // Should be expired with 121 second buffer
            expect(isTokenExpiredInState(121)).toBe(true);

            // Should NOT be expired with 119 second buffer
            expect(isTokenExpiredInState(119)).toBe(false);
        });
    });

    describe('refreshAccessToken', () => {
        it('calls authRefresh SDK with Bearer token and returns new TokenResponse', async () => {
            updateTokensInState(mockToken);
            (authRefresh as Mock).mockResolvedValue({ data: REFRESHED_TOKEN, error: null });

            const result = await refreshAccessToken();

            expect(result.success).toBe(true);
            expect(result.tokens?.opaque_token).toBe(REFRESHED_TOKEN.opaque_token);
            expect(result.tokens?.absolute_expires_at).toEqual(REFRESHED_TOKEN.absolute_expires_at);

            expect(authRefresh).toHaveBeenCalledWith({
                headers: expect.objectContaining({
                    Authorization: `Bearer ${mockToken.opaque_token}`,
                }),
            });
        });

        it('returns error when no opaque token is available', async () => {
            // No state set
            const result = await refreshAccessToken();

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(authRefresh).not.toHaveBeenCalled();
        });

        it('clears auth state and returns error when SDK reports failure', async () => {
            updateTokensInState(mockToken);
            (authRefresh as Mock).mockResolvedValue({ data: null, error: { message: 'Unauthorized' } });

            const result = await refreshAccessToken();

            expect(result.success).toBe(false);
            expect(getTokensFromState()).toBeNull();
        });

        it('updates state with new tokens on success', async () => {
            updateTokensInState(mockToken);
            (authRefresh as Mock).mockResolvedValue({ data: REFRESHED_TOKEN, error: null });

            await refreshAccessToken();

            const stored = getTokensFromState();
            expect(stored?.opaque_token).toBe(REFRESHED_TOKEN.opaque_token);
        });
    });

    describe('revokeTokens', () => {
        it('calls oauth2Revoke SDK with the opaque token', async () => {
            updateTokensInState(mockToken);
            (oauth2Revoke as Mock).mockResolvedValue({ data: {}, error: null });

            const result = await revokeTokens();

            expect(result).toBe(true);
            expect(oauth2Revoke).toHaveBeenCalledWith({
                body: { opaque_token: mockToken.opaque_token },
                headers: expect.objectContaining({
                    Authorization: `Bearer ${mockToken.opaque_token}`,
                }),
            });
        });

        it('returns true when no tokens present (nothing to revoke)', async () => {
            const result = await revokeTokens();
            expect(result).toBe(true);
            expect(oauth2Revoke).not.toHaveBeenCalled();
        });

        it('returns false on revocation error', async () => {
            updateTokensInState(mockToken);
            (oauth2Revoke as Mock).mockRejectedValue(new Error('Network error'));

            const result = await revokeTokens();

            expect(result).toBe(false);
        });
    });

    describe('scheduleTokenRefresh', () => {
        it('schedules refresh at the half-life point', () => {
            const cleanup = scheduleTokenRefresh(mockToken);

            // Timer should be scheduled
            expect(vi.getTimerCount()).toBeGreaterThan(0);

            cleanup();
        });

        it('fires refresh callback at the half-life of remaining lifetime', async () => {
            (authRefresh as Mock).mockResolvedValue({ data: REFRESHED_TOKEN, error: null });

            updateTokensInState(mockToken);
            const cleanup = scheduleTokenRefresh(getTokensFromState()!);

            const halfLife = Math.floor((mockToken.absolute_expires_at.getTime() - Date.now()) / 2);
            vi.advanceTimersByTime(halfLife);

            await flushPromises();

            expect(authRefresh).toHaveBeenCalled();

            cleanup();
        });

        it('cleanup function cancels scheduled refresh', () => {
            const cleanup = scheduleTokenRefresh(mockToken);
            const timerCount = vi.getTimerCount();

            cleanup();

            expect(vi.getTimerCount()).toBeLessThan(timerCount);
        });

        it('invokes onRefreshComplete with new TokenResponse after successful refresh', async () => {
            (authRefresh as Mock).mockResolvedValue({ data: REFRESHED_TOKEN, error: null });
            updateTokensInState(mockToken);

            const onRefreshComplete = vi.fn();
            const cleanup = scheduleTokenRefresh(getTokensFromState()!, onRefreshComplete);

            const halfLife = Math.floor((mockToken.absolute_expires_at.getTime() - Date.now()) / 2);
            vi.advanceTimersByTime(halfLife);

            await flushPromises();

            expect(onRefreshComplete).toHaveBeenCalledTimes(1);
            expect(onRefreshComplete).toHaveBeenCalledWith(
                expect.objectContaining({ opaque_token: REFRESHED_TOKEN.opaque_token }),
            );

            cleanup();
        });

        it('does not invoke onRefreshComplete when refresh fails', async () => {
            (authRefresh as Mock).mockResolvedValue({ data: null, error: { message: 'Unauthorized' } });
            updateTokensInState(mockToken);

            const onRefreshComplete = vi.fn();
            const cleanup = scheduleTokenRefresh(getTokensFromState()!, onRefreshComplete);

            const halfLife = Math.floor((mockToken.absolute_expires_at.getTime() - Date.now()) / 2);
            vi.advanceTimersByTime(halfLife);

            await flushPromises();

            expect(onRefreshComplete).not.toHaveBeenCalled();

            cleanup();
        });

        it('immediately refreshes when token has zero or negative remaining lifetime', async () => {
            (authRefresh as Mock).mockResolvedValue({ data: REFRESHED_TOKEN, error: null });

            const expiredTokens: TokenResponse = {
                opaque_token: 'st_live_expired_token',
                absolute_expires_at: new Date(Date.now() - 1000),
            };
            updateTokensInState(expiredTokens);

            const onRefreshComplete = vi.fn();
            scheduleTokenRefresh(expiredTokens, onRefreshComplete);

            // No timer advance needed — should fire immediately as a microtask
            await flushPromises();

            expect(onRefreshComplete).toHaveBeenCalledTimes(1);
        });
    });
});
