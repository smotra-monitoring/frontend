/**
 * Tests for OAuthCallbackPage
 */

import { vi, type Mock } from 'vitest';

vi.mock('../../../src/services/auth-service.js', () => ({ handleLoginCallback: vi.fn() }));
vi.mock('../../../src/auth/auth-guard.js', () => ({ getRedirectAfterLogin: vi.fn() }));

import { handleLoginCallback } from '../../../src/services/auth-service.js';
import { getRedirectAfterLogin } from '../../../src/auth/auth-guard.js';
import { OAuthCallbackPage } from '../../../src/pages/oauth-callback.js';

describe('OAuthCallbackPage', () => {
    let root: HTMLElement;
    let page: OAuthCallbackPage;
    const originalLocation = window.location;

    beforeEach(() => {
        vi.useFakeTimers();
        root = document.createElement('div');
        page = new OAuthCallbackPage(root);
        vi.spyOn(console, 'error').mockImplementation(() => { });
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { href: '' },
        });
    });

    afterEach(() => {
        page.destroy();
        Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('shows a processing state while the callback is handled', () => {
        (handleLoginCallback as Mock).mockReturnValue(new Promise(() => { }));

        page.mount();

        expect(root.querySelector('.oauth-callback__icon--processing')).not.toBeNull();
        expect(root.querySelector('.loading-spinner')).not.toBeNull();
    });

    it('redirects to the stored destination after success', async () => {
        (handleLoginCallback as Mock).mockResolvedValue([true]);
        (getRedirectAfterLogin as Mock).mockReturnValue('/agent');

        page.mount();
        await vi.advanceTimersByTimeAsync(1000);

        expect(root.querySelector('.oauth-callback__icon--success')).not.toBeNull();
        expect(window.location.href).toBe('/agent');
    });

    it('redirects to the dashboard when no destination is stored', async () => {
        (handleLoginCallback as Mock).mockResolvedValue([true]);
        (getRedirectAfterLogin as Mock).mockReturnValue(null);

        page.mount();
        await vi.advanceTimersByTimeAsync(1000);

        expect(window.location.href).toBe('/dashboard');
    });

    it('shows the error and a back-to-login link on failure', async () => {
        (handleLoginCallback as Mock).mockResolvedValue([false, 'access_denied']);

        page.mount();
        await vi.advanceTimersByTimeAsync(0);

        expect(root.querySelector('.oauth-callback__message')!.textContent).toBe('access_denied');
        expect(root.querySelector('a[href="/login"]')).not.toBeNull();
    });

    it('shows an error when the callback handler throws', async () => {
        (handleLoginCallback as Mock).mockRejectedValue(new Error('kaboom'));

        page.mount();
        await vi.advanceTimersByTimeAsync(0);

        expect(root.querySelector('.oauth-callback__message')!.textContent).toBe('kaboom');
    });
});
