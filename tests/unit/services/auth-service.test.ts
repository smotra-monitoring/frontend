/**
 * Tests for auth-service orchestration (error branches, logout, initialization)
 */

import { vi, type Mock } from 'vitest';

vi.mock('../../../src/api/index.js', () => ({
    oauth2Token: vi.fn(),
    getUserInfo: vi.fn(),
    authRefresh: vi.fn(),
    oauth2Revoke: vi.fn(),
}));

vi.mock('../../../src/auth/oauth-manager.js', () => ({
    initiateOAuthFlow: vi.fn(),
    getCodeFromOAuthCallback: vi.fn(),
    retrievePKCE: vi.fn(),
}));

vi.mock('../../../src/auth/token-manager.js', () => ({
    revokeTokens: vi.fn().mockResolvedValue(undefined),
    scheduleTokenRefresh: vi.fn(),
}));

vi.mock('../../../src/utils/navigation.js', () => ({
    navigateTo: vi.fn().mockResolvedValue(undefined),
    registerNavigate: vi.fn(),
}));

import { oauth2Token, getUserInfo } from '../../../src/api/index.js';
import { initiateOAuthFlow, getCodeFromOAuthCallback, retrievePKCE } from '../../../src/auth/oauth-manager.js';
import { revokeTokens, scheduleTokenRefresh } from '../../../src/auth/token-manager.js';
import { navigateTo } from '../../../src/utils/navigation.js';
import { clearAuthState, saveAuthState, isAuthenticated } from '../../../src/state/auth-state.js';
import { login, handleLoginCallback, logout, initializeAuthService } from '../../../src/services/auth-service.js';
import { mockToken, mockUserInfo } from '../../mocks/oauth-responses.js';
import type { OAuth2Provider } from '../../../src/types/auth-types.js';

const validCallback = { valid: true, code: 'auth-code', state: 's' };
const pkce = { code_verifier: 'verifier', code_challenge: 'challenge', state: 's' };

describe('auth-service', () => {
    beforeEach(() => {
        clearAuthState();
        vi.spyOn(console, 'error').mockImplementation(() => { });
        (scheduleTokenRefresh as Mock).mockReturnValue(vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('login', () => {
        it('starts the OAuth flow for the given provider', async () => {
            const provider = { provider: 'okta' } as unknown as OAuth2Provider;
            await login(provider);
            expect(initiateOAuthFlow).toHaveBeenCalledWith(provider);
        });

        it('does not throw when the OAuth flow fails', async () => {
            (initiateOAuthFlow as Mock).mockRejectedValue(new Error('provider down'));
            await expect(login({} as OAuth2Provider)).resolves.toBeUndefined();
        });
    });

    describe('handleLoginCallback', () => {
        it('returns the callback error when the callback is invalid', async () => {
            (getCodeFromOAuthCallback as Mock).mockReturnValue({ valid: false, error: 'access_denied' });

            const result = await handleLoginCallback();

            expect(result).toEqual([false, 'access_denied']);
            expect(oauth2Token).not.toHaveBeenCalled();
        });

        it('fails when PKCE data is missing', async () => {
            (getCodeFromOAuthCallback as Mock).mockReturnValue(validCallback);
            (retrievePKCE as Mock).mockReturnValue(null);

            expect(await handleLoginCallback()).toEqual([false, 'PKCE verification failed']);
        });

        it('fails when the token exchange returns an error', async () => {
            (getCodeFromOAuthCallback as Mock).mockReturnValue(validCallback);
            (retrievePKCE as Mock).mockReturnValue(pkce);
            (oauth2Token as Mock).mockResolvedValue({ data: undefined, error: { message: 'invalid_grant' } });

            expect(await handleLoginCallback()).toEqual([false, 'Token exchange failed']);
            expect(isAuthenticated()).toBe(false);
        });

        it('fails when user info cannot be fetched', async () => {
            (getCodeFromOAuthCallback as Mock).mockReturnValue(validCallback);
            (retrievePKCE as Mock).mockReturnValue(pkce);
            (oauth2Token as Mock).mockResolvedValue({ data: mockToken });
            (getUserInfo as Mock).mockResolvedValue({ data: undefined, error: { message: 'boom' } });

            expect(await handleLoginCallback()).toEqual([false, 'Failed to fetch user information']);
            expect(isAuthenticated()).toBe(false);
        });

        it('saves state and schedules refresh on success', async () => {
            (getCodeFromOAuthCallback as Mock).mockReturnValue(validCallback);
            (retrievePKCE as Mock).mockReturnValue(pkce);
            (oauth2Token as Mock).mockResolvedValue({ data: mockToken });
            (getUserInfo as Mock).mockResolvedValue({ data: mockUserInfo });

            expect(await handleLoginCallback()).toEqual([true]);
            expect(isAuthenticated()).toBe(true);
            expect(scheduleTokenRefresh).toHaveBeenCalledTimes(1);
        });

        it('returns an error tuple when an unexpected exception is thrown', async () => {
            (getCodeFromOAuthCallback as Mock).mockImplementation(() => {
                throw new Error('unexpected');
            });

            expect(await handleLoginCallback()).toEqual([false, 'unexpected']);
        });
    });

    describe('logout', () => {
        it('revokes tokens, clears state and navigates to login', async () => {
            saveAuthState(mockUserInfo, mockToken);

            await logout();

            expect(revokeTokens).toHaveBeenCalled();
            expect(isAuthenticated()).toBe(false);
            expect(navigateTo).toHaveBeenCalledWith('/login', 'replace');
        });

        it('still clears state and navigates when revocation fails', async () => {
            saveAuthState(mockUserInfo, mockToken);
            (revokeTokens as Mock).mockRejectedValueOnce(new Error('network'));

            await logout();

            expect(isAuthenticated()).toBe(false);
            expect(navigateTo).toHaveBeenCalledWith('/login', 'replace');
        });
    });

    describe('initializeAuthService', () => {
        it('does not schedule a refresh when there are no stored tokens', () => {
            initializeAuthService();
            expect(scheduleTokenRefresh).not.toHaveBeenCalled();
        });

        it('schedules a refresh when tokens are present in state', () => {
            saveAuthState(mockUserInfo, mockToken);
            initializeAuthService();
            expect(scheduleTokenRefresh).toHaveBeenCalledTimes(1);
        });
    });
});
