/**
 * Unit tests for SettingsPage and its `/settings` route registration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../src/services/session-service.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../src/services/session-service.js')>();
    return { ...actual, fetchSessions: vi.fn() };
});

import { SettingsPage } from '../../../src/pages/settings.js';
import { ROUTES_for_tests } from '../../../src/pages/router.js';
import { fetchSessions } from '../../../src/services/session-service.js';
import { mockSessions } from '../../mocks/session-data.js';

describe('SettingsPage', () => {
    let container: HTMLElement;
    let page: SettingsPage | null = null;

    beforeEach(() => {
        vi.mocked(fetchSessions).mockResolvedValue(mockSessions);
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        page?.destroy();
        page = null;
        container.remove();
    });

    it('renders the page title and main landmark', () => {
        page = new SettingsPage(container);
        page.mount();

        expect(container.querySelector('main.dashboard__main')).toBeTruthy();
        expect(container.querySelector('.dashboard__title')?.textContent).toBe('Settings');
    });

    it('mounts the sessions section and loads sessions', async () => {
        page = new SettingsPage(container);
        page.mount();

        expect(container.querySelector('#sessions-section-container .settings-section')).toBeTruthy();
        await vi.waitFor(() => expect(container.querySelectorAll('.session-row')).toHaveLength(mockSessions.length));
        expect(fetchSessions).toHaveBeenCalledTimes(1);
    });

    it('shows an error toast when loading fails', async () => {
        vi.mocked(fetchSessions).mockRejectedValue(new Error('server down'));
        page = new SettingsPage(container);
        page.mount();

        await vi.waitFor(() => expect(container.querySelector('.toast--error')?.textContent).toContain('server down'));
    });

    it('cleans up child components on destroy', () => {
        page = new SettingsPage(container);
        page.mount();
        page.destroy();

        expect(container.innerHTML).toBe('');
    });

    it('is registered as a private /settings route', () => {
        const route = ROUTES_for_tests.find(r => r.path === '/settings');
        expect(route?.component).toBe(SettingsPage);
        expect(route?.strategy).toBe('private');
    });
});
