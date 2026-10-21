/**
 * Tests for LoginPage
 */

import { vi, type Mock } from 'vitest';

vi.mock('../../../src/services/auth-service.js', () => ({ login: vi.fn() }));

import { login } from '../../../src/services/auth-service.js';
import { LoginPage } from '../../../src/pages/login.js';

describe('LoginPage', () => {
    let root: HTMLElement;
    let page: LoginPage;

    beforeEach(() => {
        root = document.createElement('div');
        page = new LoginPage(root);
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        page.destroy();
        vi.restoreAllMocks();
    });

    it('renders a labelled button for every provider', () => {
        page.mount();

        const buttons = root.querySelectorAll<HTMLButtonElement>('.login-provider');
        expect(buttons).toHaveLength(5);
        buttons.forEach(b => expect(b.getAttribute('aria-label')).toMatch(/^Sign in with /));
    });

    it('starts login with the clicked provider', async () => {
        (login as Mock).mockResolvedValue(undefined);
        page.mount();

        root.querySelector<HTMLButtonElement>('[data-provider="google"]')!.click();
        await Promise.resolve();

        expect(login).toHaveBeenCalledWith('google');
    });

    it('disables provider buttons while login is in progress', () => {
        (login as Mock).mockReturnValue(new Promise(() => { }));
        page.mount();

        root.querySelector<HTMLButtonElement>('[data-provider="okta"]')!.click();

        root.querySelectorAll<HTMLButtonElement>('.login-provider').forEach(b => expect(b.disabled).toBe(true));
    });

    it('shows an error and re-enables buttons when login throws', async () => {
        (login as Mock).mockRejectedValue(new Error('provider unavailable'));
        page.mount();

        root.querySelector<HTMLButtonElement>('[data-provider="okta"]')!.click();
        await vi.waitFor(() => expect(root.querySelector('.notification')).not.toBeNull());

        expect(root.querySelector('.notification')!.textContent).toContain('provider unavailable');
        expect(root.querySelector<HTMLButtonElement>('.login-provider')!.disabled).toBe(false);
    });

    it('clears the error when the dismiss button is clicked', async () => {
        (login as Mock).mockRejectedValue(new Error('oops'));
        page.mount();
        root.querySelector<HTMLButtonElement>('[data-provider="okta"]')!.click();
        await vi.waitFor(() => expect(root.querySelector('.notification')).not.toBeNull());

        root.querySelector<HTMLButtonElement>('[data-action="clear-error"]')!.click();

        expect(root.querySelector('.notification')).toBeNull();
    });
});
