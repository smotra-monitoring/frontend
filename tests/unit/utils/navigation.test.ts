/**
 * Tests for the navigation registry
 */

import { vi } from 'vitest';

describe('navigation', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('delegates to the registered navigate function', async () => {
        const { registerNavigate, navigateTo } = await import('../../../src/utils/navigation.js');
        const fn = vi.fn().mockResolvedValue(undefined);
        registerNavigate(fn);

        await navigateTo('/agent', 'push');

        expect(fn).toHaveBeenCalledWith('/agent', 'push');
    });

    it('defaults to replace mode', async () => {
        const { registerNavigate, navigateTo } = await import('../../../src/utils/navigation.js');
        const fn = vi.fn().mockResolvedValue(undefined);
        registerNavigate(fn);

        await navigateTo('/login');

        expect(fn).toHaveBeenCalledWith('/login', 'replace');
    });

    it('falls back to history.replaceState when no router is registered', async () => {
        const { navigateTo } = await import('../../../src/utils/navigation.js');

        await navigateTo('/fallback');

        expect(window.location.pathname).toBe('/fallback');
    });
});
