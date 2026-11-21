import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../src/api/index.js', () => ({
    getAgentConfiguration: vi.fn(),
    listAgents: vi.fn(),
}));
vi.mock('../../../src/auth/token-manager.js', () => ({ getValidAccessToken: vi.fn() }));

import { getAgentConfiguration } from '../../../src/api/index.js';
import { getValidAccessToken } from '../../../src/auth/token-manager.js';
import { AgentDetailsPanel } from '../../../src/widgets/agent-details.js';
import { removeAgent, setAgents } from '../../../src/state/agent-state.js';
import { closeAgentDetails, getAgentDetailsPanelState, openAgentDetails } from '../../../src/state/agent-details-panel-state.js';
import { getAgentConfigState, resetAgentConfig } from '../../../src/state/agent-config-state.js';
import { mockAgent, mockAgentConfigPatch, mockAgents } from '../../mocks/agent-data.js';

type ConfigResult = Awaited<ReturnType<typeof getAgentConfiguration>>;

const ok = (data = mockAgentConfigPatch) => ({ data, response: { status: 200 } }) as unknown as ConfigResult;
const failed = (status: number, message: string) =>
    ({ error: { error: 'x', message }, response: { status } }) as unknown as ConfigResult;

describe('AgentDetailsPanel', () => {
    let container: HTMLElement;
    let widget: AgentDetailsPanel;
    let chevron: HTMLButtonElement;

    const aside = () => container.querySelector<HTMLElement>('#side-panel')!;
    const section = (id: string) => container.querySelector<HTMLElement>(`#side-panel-section-${id}`)!;
    const configCalls = () => vi.mocked(getAgentConfiguration).mock.calls;

    beforeEach(() => {
        vi.mocked(getAgentConfiguration).mockReset().mockResolvedValue(ok());
        vi.mocked(getValidAccessToken).mockReset().mockResolvedValue('st_live_token');
        vi.spyOn(console, 'error').mockImplementation(() => { });

        setAgents(mockAgents);
        container = document.createElement('div');
        chevron = document.createElement('button');
        chevron.setAttribute('data-action', 'toggle-details');
        chevron.dataset.agentId = mockAgent.id;
        document.body.append(container, chevron);

        widget = new AgentDetailsPanel(container);
        widget.mount();
    });

    afterEach(() => {
        widget.destroy();
        document.body.innerHTML = '';
        setAgents([]);
        vi.restoreAllMocks();
    });

    it('starts closed', () => {
        expect(aside().classList.contains('side-panel--open')).toBe(false);
    });

    it('opens with General and Network expanded and Config collapsed, without fetching', () => {
        openAgentDetails(mockAgent.id);

        expect(aside().classList.contains('side-panel--open')).toBe(true);
        expect(container.querySelector('#side-panel-title')?.textContent).toBe(mockAgent.name);
        expect(section('general').hidden).toBe(false);
        expect(section('general').textContent).toContain(mockAgent.id);
        expect(section('network').hidden).toBe(false);
        expect(section('network').textContent).toContain('192.168.1.100');
        expect(section('config').hidden).toBe(true);
        expect(container.querySelector('#side-panel-toggle-config')?.textContent).toContain('Config patch preview');
        expect(configCalls()).toHaveLength(0);
    });

    it('expands the config section and fetches it when requested', async () => {
        openAgentDetails(mockAgent.id, { expandConfig: true });

        expect(section('config').hidden).toBe(false);
        expect(configCalls()).toHaveLength(1);
        expect(configCalls()[0]?.[0]?.path).toEqual({ agentId: mockAgent.id });

        await vi.waitFor(() => expect(section('config').textContent).toContain('interval_secs'));
        expect(section('config').textContent).toContain('production');
    });

    it('shows a loading state while the request is in flight', () => {
        vi.mocked(getAgentConfiguration).mockReturnValue(new Promise(() => { }) as ReturnType<typeof getAgentConfiguration>);
        openAgentDetails(mockAgent.id, { expandConfig: true });

        expect(section('config').textContent).toContain('Loading configuration');
    });

    it('fetches when the user expands the section manually', async () => {
        openAgentDetails(mockAgent.id);
        container.querySelector<HTMLButtonElement>('#side-panel-toggle-config')!.click();

        await vi.waitFor(() => expect(section('config').textContent).toContain('interval_secs'));
        expect(configCalls()).toHaveLength(1);
    });

    it('does not refetch for the same agent when Desired is clicked again', async () => {
        openAgentDetails(mockAgent.id, { expandConfig: true });
        await vi.waitFor(() => expect(section('config').textContent).toContain('interval_secs'));

        openAgentDetails(mockAgent.id, { expandConfig: true });

        expect(configCalls()).toHaveLength(1);
    });

    it('refetches for the new agent on a swap while the config section is expanded', async () => {
        const other = mockAgents[1]!;
        openAgentDetails(mockAgent.id, { expandConfig: true });
        await vi.waitFor(() => expect(getAgentConfigState().status).toBe('loaded'));

        vi.mocked(getAgentConfiguration).mockResolvedValue(
            ok({ ...mockAgentConfigPatch, id: other.id, name: other.name, config_version_desired: other.config_version_desired })
        );
        openAgentDetails(other.id);

        expect(container.querySelector('#side-panel-title')?.textContent).toBe(other.name);
        expect(configCalls()).toHaveLength(2);
        expect(configCalls()[1]?.[0]?.path).toEqual({ agentId: other.id });
        await vi.waitFor(() => expect(getAgentConfigState()).toMatchObject({ agentId: other.id, status: 'loaded' }));
    });

    it('never shows another agent\'s config after a swap with the section collapsed', async () => {
        openAgentDetails(mockAgent.id, { expandConfig: true });
        await vi.waitFor(() => expect(getAgentConfigState().status).toBe('loaded'));
        container.querySelector<HTMLButtonElement>('#side-panel-toggle-config')!.click();

        openAgentDetails(mockAgents[1]!.id);

        expect(configCalls()).toHaveLength(1);
        expect(section('config').textContent?.trim()).toBe('');
        expect(getAgentConfigState().status).toBe('idle');
    });

    it('shows a stale banner when the list reports another desired version', async () => {
        openAgentDetails(mockAgent.id, { expandConfig: true });
        await vi.waitFor(() => expect(getAgentConfigState().status).toBe('loaded'));
        expect(section('config').textContent).not.toContain('Agent list shows version');

        setAgents(mockAgents.map(a => (a.id === mockAgent.id ? { ...a, config_version_desired: BigInt(4) } : a)));

        expect(section('config').textContent).toContain('Agent list shows version 4, this view shows 3.');
        expect(configCalls()).toHaveLength(1);
    });

    it('reloads from the stale banner', async () => {
        openAgentDetails(mockAgent.id, { expandConfig: true });
        await vi.waitFor(() => expect(getAgentConfigState().status).toBe('loaded'));
        setAgents(mockAgents.map(a => (a.id === mockAgent.id ? { ...a, config_version_desired: BigInt(4) } : a)));
        vi.mocked(getAgentConfiguration).mockResolvedValue(ok({ ...mockAgentConfigPatch, config_version_desired: BigInt(4) }));

        section('config').querySelector<HTMLButtonElement>('[data-action="reload-config"]')!.click();

        expect(configCalls()).toHaveLength(2);
        await vi.waitFor(() => expect(section('config').textContent).not.toContain('Agent list shows version'));
    });

    it('updates General live when the agent list changes', () => {
        openAgentDetails(mockAgent.id);
        setAgents(mockAgents.map(a => (a.id === mockAgent.id ? { ...a, name: 'Renamed', agent_version: '9.9.9' } : a)));

        expect(container.querySelector('#side-panel-title')?.textContent).toBe('Renamed');
        expect(section('general').textContent).toContain('9.9.9');
    });

    it('shows the server error message and retries on demand', async () => {
        vi.mocked(getAgentConfiguration).mockResolvedValueOnce(failed(404, 'agent has no stored configuration'));
        openAgentDetails(mockAgent.id, { expandConfig: true });

        await vi.waitFor(() => expect(section('config').textContent).toContain('agent has no stored configuration'));
        expect(section('config').querySelector('[role="alert"]')).toBeTruthy();

        section('config').querySelector<HTMLButtonElement>('[data-action="retry-config"]')!.click();

        expect(configCalls()).toHaveLength(2);
        await vi.waitFor(() => expect(section('config').textContent).toContain('interval_secs'));
    });

    it('closes when the selected agent disappears from the list', () => {
        openAgentDetails(mockAgent.id);
        removeAgent(mockAgent.id);

        expect(getAgentDetailsPanelState().agentId).toBeNull();
        expect(aside().classList.contains('side-panel--open')).toBe(false);
    });

    it('does not open for an unknown agent', () => {
        openAgentDetails('does-not-exist');

        expect(getAgentDetailsPanelState().agentId).toBeNull();
        expect(aside().classList.contains('side-panel--open')).toBe(false);
    });

    it('resets the config on close and refetches when reopened with the config section still expanded', async () => {
        openAgentDetails(mockAgent.id, { expandConfig: true });
        await vi.waitFor(() => expect(getAgentConfigState().status).toBe('loaded'));

        closeAgentDetails();
        expect(getAgentConfigState().status).toBe('idle');

        openAgentDetails(mockAgent.id);
        expect(section('config').hidden).toBe(false);
        expect(configCalls()).toHaveLength(2);
        await vi.waitFor(() => expect(getAgentConfigState().status).toBe('loaded'));
    });

    it('does not fetch on reopen when the user collapsed the config section', async () => {
        openAgentDetails(mockAgent.id, { expandConfig: true });
        await vi.waitFor(() => expect(getAgentConfigState().status).toBe('loaded'));
        container.querySelector<HTMLButtonElement>('#side-panel-toggle-config')!.click();

        closeAgentDetails();
        openAgentDetails(mockAgent.id);

        expect(section('config').hidden).toBe(true);
        expect(configCalls()).toHaveLength(1);
        expect(getAgentConfigState().status).toBe('idle');
    });

    it('closes on Escape, updates the shared state and refocuses the row chevron', () => {
        openAgentDetails(mockAgent.id);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(getAgentDetailsPanelState().agentId).toBeNull();
        expect(document.activeElement).toBe(chevron);
    });

    it('closes on an outside click', () => {
        openAgentDetails(mockAgent.id);
        document.body.click();

        expect(getAgentDetailsPanelState().agentId).toBeNull();
        expect(aside().classList.contains('side-panel--open')).toBe(false);
    });

    it('clears shared state on destroy', () => {
        openAgentDetails(mockAgent.id, { expandConfig: true });
        widget.destroy();

        expect(getAgentDetailsPanelState().agentId).toBeNull();
        expect(getAgentConfigState().status).toBe('idle');
        resetAgentConfig();
    });
});
