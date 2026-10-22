/**
 * Regression: a 401 from the API must end the local session and redirect to /login.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type ResponseInterceptor = (response: Response, request: Request) => Response;

const mocks = vi.hoisted(() => ({
    interceptor: null as null | ResponseInterceptor,
    use: vi.fn(),
    clearAuthState: vi.fn(),
    getTokensFromState: vi.fn(),
    navigateTo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/api/client.gen.js', () => ({
    client: {
        interceptors: {
            response: {
                use: (fn: ResponseInterceptor) => {
                    mocks.interceptor = fn;
                    mocks.use(fn);
                },
            },
        },
    },
}));
vi.mock('../../../src/api/index.js', () => ({ oauth2Token: vi.fn(), getUserInfo: vi.fn() }));
vi.mock('../../../src/auth/oauth-manager.js', () => ({
    initiateOAuthFlow: vi.fn(),
    getCodeFromOAuthCallback: vi.fn(),
    retrievePKCE: vi.fn(),
}));
vi.mock('../../../src/auth/token-manager.js', () => ({
    revokeTokens: vi.fn(),
    scheduleTokenRefresh: vi.fn(),
}));
vi.mock('../../../src/state/auth-state.js', () => ({
    saveAuthState: vi.fn(),
    clearAuthState: mocks.clearAuthState,
    setAuthLoading: vi.fn(),
    setAuthError: vi.fn(),
    getTokensFromState: mocks.getTokensFromState,
}));
vi.mock('../../../src/utils/navigation.js', () => ({ navigateTo: mocks.navigateTo }));

import { installUnauthorizedInterceptor_for_testing } from '../../../src/services/auth-service.js';

function call(status: number, url: string): void {
    mocks.interceptor!(new Response(null, { status }), new Request(url));
}

describe('installUnauthorizedInterceptor', () => {
    beforeEach(() => {
        mocks.clearAuthState.mockClear();
        mocks.navigateTo.mockClear();
        mocks.getTokensFromState.mockReturnValue({ opaque_token: 't', expires_at: '2099-01-01T00:00:00Z' });
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    it('registers only once', () => {
        installUnauthorizedInterceptor_for_testing();
        installUnauthorizedInterceptor_for_testing();
        expect(mocks.use).toHaveBeenCalledTimes(1);
    });

    it('clears the session and redirects to /login on 401', () => {
        installUnauthorizedInterceptor_for_testing();
        call(401, 'https://api.example.com/v1/agents');

        expect(mocks.clearAuthState).toHaveBeenCalledTimes(1);
        expect(mocks.navigateTo).toHaveBeenCalledWith('/login', 'replace');
    });

    it('ignores non-401 responses', () => {
        installUnauthorizedInterceptor_for_testing();
        call(500, 'https://api.example.com/v1/agents');

        expect(mocks.clearAuthState).not.toHaveBeenCalled();
    });

    it('ignores 401 when there is no session', () => {
        mocks.getTokensFromState.mockReturnValue(null);
        installUnauthorizedInterceptor_for_testing();
        call(401, 'https://api.example.com/v1/agents');

        expect(mocks.navigateTo).not.toHaveBeenCalled();
    });

    it.each(['/v1/auth/oauth2/token', '/v1/auth/oauth2/revoke', '/v1/auth/logout'])(
        'ignores 401 from %s',
        (path) => {
            installUnauthorizedInterceptor_for_testing();
            call(401, `https://api.example.com${path}`);

            expect(mocks.clearAuthState).not.toHaveBeenCalled();
        },
    );
});
