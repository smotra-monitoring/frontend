/**
 * Integration test: agent details side panel and config patch preview on `/agent`
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

vi.mock('../../src/auth/auth-guard.js', () => ({
    protectRoute: vi.fn().mockResolvedValue(true),
    canAccessPublicRoute: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('../../src/api/index.js', async (importOriginal) => {
    const { mockAgents } = await import('../mocks/agent-data.js');
    const actual = await importOriginal<typeof import('../../src/api/index.js')>();
    return {
        ...actual,
        getAgentConfiguration: vi.fn(),
        listAgents: vi.fn().mockResolvedValue({
            data: {
                agents: mockAgents,
                pagination: { page: 1, page_size: 100, total_items: mockAgents.length, total_pages: 1, has_next: false },
            },
        }),
    };
});

import { initializeRouter } from '../../src/pages/router.js';
import { getAgentConfiguration } from '../../src/api/index.js';
import { getAgentDetailsPanelState } from '../../src/state/agent-details-panel-state.js';
import { mockAgentConfigPatch, mockAgents } from '../mocks/agent-data.js';

type ConfigResult = Awaited<ReturnType<typeof getAgentConfiguration>>;

describe('Agent details side panel (Integration)', () => {
    let appRoot: HTMLElement;

    const rows = () => appRoot.querySelectorAll<HTMLTableRowElement>('.agent-states-row');
    const panel = () => appRoot.querySelector<HTMLElement>('#side-panel')!;
    const configBody = () => appRoot.querySelector<HTMLElement>('#side-panel-section-config')!;

    beforeAll(async () => {
        Element.prototype.scrollIntoView = vi.fn();
        window.history.replaceState({}, '', '/agent');
        appRoot = document.createElement('div');
        appRoot.id = 'app';
        document.body.appendChild(appRoot);
        await initializeRouter(appRoot);
        await vi.waitFor(() => expect(rows()).toHaveLength(mockAgents.length));
    });

    beforeEach(() => {
        vi.mocked(getAgentConfiguration).mockReset().mockResolvedValue(
            { data: mockAgentConfigPatch, response: { status: 200 } } as unknown as ConfigResult
        );
        // Close any panel left open by a previous test
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    // Section state persists across tests (one page instance), so this must stay the first test.
    it('opens from a row with General and Network only, without calling the API', () => {
        rows()[0]!.click();

        expect(panel().classList.contains('side-panel--open')).toBe(true);
        expect(appRoot.querySelector('#side-panel-section-general')?.textContent).toContain(mockAgents[0]!.id);
        expect(appRoot.querySelector('#side-panel-section-network')?.textContent).toContain('192.168.1.100');
        expect(configBody().hidden).toBe(true);
        expect(getAgentConfiguration).not.toHaveBeenCalled();
    });

    it('fetches and shows the config patch when the Desired version is clicked', async () => {
        rows()[0]!.querySelector<HTMLButtonElement>('[data-action="show-config"]')!.click();

        expect(panel().classList.contains('side-panel--open')).toBe(true);
        expect(configBody().hidden).toBe(false);
        expect(getAgentConfiguration).toHaveBeenCalledTimes(1);
        expect(vi.mocked(getAgentConfiguration).mock.calls[0]?.[0]?.path).toEqual({ agentId: mockAgents[0]!.id });

        await vi.waitFor(() => expect(configBody().textContent).toContain('interval_secs'));
        expect(configBody().textContent).toContain('production');
        expect(configBody().textContent).toContain('10.0.0.1:443');
    });

    it('shows the server error message when the fetch fails', async () => {
        vi.mocked(getAgentConfiguration).mockResolvedValue(
            { error: { error: 'not_found', message: 'No configuration stored for this agent' }, response: { status: 404 } } as unknown as ConfigResult
        );
        vi.spyOn(console, 'error').mockImplementation(() => { });

        rows()[0]!.querySelector<HTMLButtonElement>('[data-action="show-config"]')!.click();

        await vi.waitFor(() => expect(configBody().textContent).toContain('No configuration stored for this agent'));
        expect(configBody().querySelector('[role="alert"]')).toBeTruthy();
    });

    it('swaps the panel to another agent and refetches while the config section is open', async () => {
        rows()[0]!.querySelector<HTMLButtonElement>('[data-action="show-config"]')!.click();
        await vi.waitFor(() => expect(configBody().textContent).toContain('interval_secs'));

        rows()[1]!.click();

        expect(panel().querySelector('#side-panel-title')?.textContent).toBe(mockAgents[1]!.name);
        expect(getAgentConfiguration).toHaveBeenCalledTimes(2);
        expect(vi.mocked(getAgentConfiguration).mock.calls[1]?.[0]?.path).toEqual({ agentId: mockAgents[1]!.id });
        expect(rows()[0]!.classList.contains('agent-states-row--selected')).toBe(false);
        expect(rows()[1]!.classList.contains('agent-states-row--selected')).toBe(true);
    });

    it('closes on an outside click but not on a click inside the panel', () => {
        rows()[0]!.click();

        panel().querySelector<HTMLElement>('.side-panel__body')!.click();
        expect(panel().classList.contains('side-panel--open')).toBe(true);

        appRoot.querySelector<HTMLElement>('.dashboard__title')!.click();
        expect(panel().classList.contains('side-panel--open')).toBe(false);
        expect(getAgentDetailsPanelState().agentId).toBeNull();
    });

    it('keeps the user\'s section state when the panel is reopened', () => {
        rows()[0]!.click();
        appRoot.querySelector<HTMLButtonElement>('#side-panel-toggle-general')!.click();
        expect(appRoot.querySelector<HTMLElement>('#side-panel-section-general')!.hidden).toBe(true);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        rows()[0]!.click();

        expect(appRoot.querySelector<HTMLElement>('#side-panel-section-general')!.hidden).toBe(true);
    });
});
