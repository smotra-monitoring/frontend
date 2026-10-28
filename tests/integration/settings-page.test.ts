/**
 * Integration test: `/settings` renders active sessions and supports terminating them
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';

vi.mock('../../src/auth/auth-guard.js', () => ({
    protectRoute: vi.fn().mockResolvedValue(true),
    canAccessPublicRoute: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('../../src/api/index.js', async (importOriginal) => {
    const { mockSessions } = await import('../mocks/session-data.js');
    const actual = await importOriginal<typeof import('../../src/api/index.js')>();
    return {
        ...actual,
        listSessions: vi.fn().mockResolvedValue({ data: { sessions: mockSessions } }),
        purgeSession: vi.fn().mockResolvedValue({ data: undefined }),
        purgeSessions: vi.fn().mockResolvedValue({ data: { revoked_count: 2 } }),
    };
});

import { initializeRouter } from '../../src/pages/router.js';
import { listSessions, purgeSession, purgeSessions } from '../../src/api/index.js';
import { mockSessions } from '../mocks/session-data.js';

describe('Settings page (Integration)', () => {
    let appRoot: HTMLElement;

    const rows = () => appRoot.querySelectorAll('.session-row');
    const click = (el: Element | null) => (el as HTMLElement).click();

    beforeAll(async () => {
        Element.prototype.scrollIntoView = vi.fn();
        window.history.replaceState({}, '', '/settings');
        appRoot = document.createElement('div');
        appRoot.id = 'app';
        document.body.appendChild(appRoot);
        await initializeRouter(appRoot);
    });

    it('renders the sessions section with one line per session when loading /settings directly', async () => {
        await vi.waitFor(() => expect(rows()).toHaveLength(mockSessions.length));

        expect(appRoot.querySelector('.settings-page')).toBeTruthy();
        expect(appRoot.querySelector('details.settings-section[open]')).toBeTruthy();
    });

    it('highlights the Settings sidebar link as active', () => {
        expect(appRoot.querySelector('.sidebar__link--active')?.getAttribute('data-route')).toBe('/settings');
    });

    it('terminates a single session after confirmation and refreshes the list', async () => {
        await vi.waitFor(() => expect(rows()).toHaveLength(3));
        vi.mocked(listSessions).mockResolvedValueOnce({
            data: { sessions: [mockSessions[0]!, mockSessions[2]!] },
        } as never);

        click(rows()[1]!.querySelector('[data-action="terminate"]'));
        expect(purgeSession).not.toHaveBeenCalled();
        click(rows()[1]!.querySelector('[data-action="terminate"]'));

        expect(purgeSession).toHaveBeenCalledWith(
            expect.objectContaining({ path: { session_id: mockSessions[1]!.id } })
        );
        await vi.waitFor(() => expect(rows()).toHaveLength(2));
        await vi.waitFor(() => expect(appRoot.querySelector('.toast--success')?.textContent).toContain('Session terminated'));
    });

    it('terminates all other sessions with Terminate All', async () => {
        vi.mocked(listSessions).mockResolvedValue({ data: { sessions: [mockSessions[0]!] } } as never);

        click(appRoot.querySelector('[data-action="terminate-all"]'));
        expect(purgeSessions).not.toHaveBeenCalled();
        click(appRoot.querySelector('[data-action="terminate-all"]'));

        expect(purgeSessions).toHaveBeenCalledTimes(1);
        await vi.waitFor(() => expect(rows()).toHaveLength(1));
        expect(appRoot.querySelector<HTMLButtonElement>('[data-action="terminate-all"]')!.disabled).toBe(true);
    });
});
