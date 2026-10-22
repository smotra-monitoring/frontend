/**
 * Integration test: dashboard shows the agents summary tile, which navigates to `/agent`
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';

vi.mock('../../src/auth/auth-guard.js', () => ({
    protectRoute: vi.fn().mockResolvedValue(true),
    canAccessPublicRoute: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('../../src/api/index.js', async (importOriginal) => {
    const { mockAgents } = await import('../mocks/agent-data.js');
    const actual = await importOriginal<typeof import('../../src/api/index.js')>();
    return {
        ...actual,
        listAgents: vi.fn().mockResolvedValue({
            data: {
                agents: mockAgents,
                pagination: { page: 1, page_size: 100, total_items: mockAgents.length, total_pages: 1, has_next: false },
            },
        }),
    };
});

import { initializeRouter } from '../../src/pages/router.js';
import { mockAgents } from '../mocks/agent-data.js';

describe('Dashboard agents summary (Integration)', () => {
    let appRoot: HTMLElement;

    beforeAll(async () => {
        Element.prototype.scrollIntoView = vi.fn();
        window.history.replaceState({}, '', '/dashboard');
        appRoot = document.createElement('div');
        appRoot.id = 'app';
        document.body.appendChild(appRoot);
        await initializeRouter(appRoot);
    });

    it('shows the summary tile instead of the full agent table', async () => {
        await vi.waitFor(() => {
            expect(appRoot.querySelector('.agents-summary__total')?.textContent).toBe(`/${mockAgents.length}`);
        });
        expect(appRoot.querySelector('.agent-states-table')).toBeNull();
    });

    it('navigates to /agent when the tile is clicked', async () => {
        appRoot.querySelector<HTMLAnchorElement>('.agents-summary')!.click();

        await vi.waitFor(() => {
            expect(window.location.pathname).toBe('/agent');
            expect(appRoot.querySelector('.agents-page .agent-states-widget')).toBeTruthy();
        });
    });
});
