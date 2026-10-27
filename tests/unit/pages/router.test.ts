/**
 * Tests for the client-side router
 */

import { vi, type Mock } from 'vitest';

const { mounted, destroyed, makePage } = vi.hoisted(() => {
    const mounted: string[] = [];
    const destroyed: string[] = [];
    const makePage = (name: string) =>
        class {
            constructor(public root: HTMLElement) { }
            mount() { mounted.push(name); }
            destroy() { destroyed.push(name); }
        };
    return { mounted, destroyed, makePage };
});

vi.mock('../../../src/pages/login.js', () => ({ LoginPage: makePage('login') }));
vi.mock('../../../src/pages/oauth-callback.js', () => ({ OAuthCallbackPage: makePage('callback') }));
vi.mock('../../../src/pages/dashboard.js', () => ({ DashboardPage: makePage('dashboard') }));
vi.mock('../../../src/pages/agents.js', () => ({ AgentsPage: makePage('agents') }));
vi.mock('../../../src/pages/settings.js', () => ({ SettingsPage: makePage('settings') }));

vi.mock('../../../src/auth/auth-guard.js', () => ({
    protectRoute: vi.fn(),
    canAccessPublicOnlyRoute: vi.fn(),
}));
vi.mock('../../../src/state/auth-state.js', () => ({ isAuthenticated: vi.fn() }));
vi.mock('../../../src/utils/dom-helpers.js', () => ({ smoothScrollTo: vi.fn() }));
vi.mock('../../../src/utils/navigation.js', () => ({ registerNavigate: vi.fn(), navigateTo: vi.fn() }));

type RouterModule = typeof import('../../../src/pages/router.js');

describe('router', () => {
    let router: RouterModule;
    let appRoot: HTMLElement;
    let protectRoute: Mock;
    let canAccessPublicOnlyRoute: Mock;
    let isAuthenticated: Mock;
    let registerNavigate: Mock;

    beforeEach(async () => {
        // The router keeps a module-level singleton, so load a fresh copy per test
        vi.resetModules();
        router = await import('../../../src/pages/router.js');
        ({ protectRoute, canAccessPublicOnlyRoute } = (await import('../../../src/auth/auth-guard.js')) as any);
        ({ isAuthenticated } = (await import('../../../src/state/auth-state.js')) as any);
        ({ registerNavigate } = (await import('../../../src/utils/navigation.js')) as any);

        mounted.length = 0;
        destroyed.length = 0;
        appRoot = document.createElement('div');
        window.history.replaceState({}, '', '/dashboard');

        (protectRoute as Mock).mockResolvedValue(true);
        (canAccessPublicOnlyRoute as Mock).mockReturnValue({ allowed: true });
        (isAuthenticated as Mock).mockReturnValue(false);
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('registers its navigate function and renders the initial route on init', async () => {
        await router.initializeRouter(appRoot);

        expect(registerNavigate).toHaveBeenCalledWith(expect.any(Function));
        expect(mounted).toEqual(['dashboard']);
        expect(appRoot.querySelector('.page-container')).not.toBeNull();
    });

    it('returns the same instance when initialized twice', async () => {
        const first = await router.initializeRouter(appRoot);
        const second = await router.initializeRouter(appRoot);

        expect(second).toBe(first);
    });

    it('throws when navigating before initialization', async () => {
        await expect(router.navigate('/dashboard')).rejects.toThrow('Router not initialized');
    });

    it('destroys the previous page when navigating to another route', async () => {
        await router.initializeRouter(appRoot);
        await router.navigate('/agent');

        expect(destroyed).toEqual(['dashboard']);
        expect(mounted).toEqual(['dashboard', 'agents']);
        expect(appRoot.querySelectorAll('.page-container')).toHaveLength(1);
    });

    it('pushes history entries on regular navigation', async () => {
        await router.initializeRouter(appRoot);
        await router.navigate('/agent');

        expect(window.location.pathname).toBe('/agent');
    });

    it('does not render a private route when the guard denies access', async () => {
        (protectRoute as Mock).mockResolvedValue(false);

        await router.initializeRouter(appRoot);

        expect(mounted).toEqual([]);
    });

    it('redirects authenticated users away from guest-only routes', async () => {
        window.history.replaceState({}, '', '/login');
        (canAccessPublicOnlyRoute as Mock).mockReturnValue({ allowed: false, redirectTo: '/dashboard' });

        await router.initializeRouter(appRoot);

        expect(mounted).toEqual(['dashboard']);
        expect(window.location.pathname).toBe('/dashboard');
    });

    it('falls back to /login for unknown routes when logged out', async () => {
        window.history.replaceState({}, '', '/nope');

        await router.initializeRouter(appRoot);

        expect(mounted).toEqual(['login']);
        expect(window.location.pathname).toBe('/login');
    });

    it('falls back to /dashboard for unknown routes when logged in', async () => {
        window.history.replaceState({}, '', '/nope');
        (isAuthenticated as Mock).mockReturnValue(true);

        await router.initializeRouter(appRoot);

        expect(mounted).toEqual(['dashboard']);
        expect(window.location.pathname).toBe('/dashboard');
    });

    it('exposes the expected route table', () => {
        const strategies = Object.fromEntries(router.ROUTES_for_tests.map(r => [r.path, r.strategy]));

        expect(strategies).toEqual({
            '/': 'private',
            '/dashboard': 'private',
            '/agent': 'private',
            '/settings': 'private',
            '/login': 'guest-only',
            '/auth/callback': 'guest-only',
        });
    });
});
