import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../src/api/index.js', () => ({
    getAgent: vi.fn(),
    getAgentConfiguration: vi.fn(),
    listAgents: vi.fn(),
}));
vi.mock('../../../src/auth/token-manager.js', () => ({ getValidAccessToken: vi.fn() }));

import { getAgent, getAgentConfiguration } from '../../../src/api/index.js';
import { getValidAccessToken } from '../../../src/auth/token-manager.js';
import { AgentDetailsPanel } from '../../../src/widgets/agent-details.js';
import { setAgents } from '../../../src/state/agent-state.js';
import { closeAgentDetails, getAgentDetailsPanelState, openAgentDetails } from '../../../src/state/agent-details-panel-state.js';
import { getAgentConfigState, resetAgentConfig } from '../../../src/state/agent-config-state.js';
import { getAgentDetailsState } from '../../../src/state/agent-details-state.js';
import { mockAgent, mockAgentConfigPatch, mockAgents } from '../../mocks/agent-data.js';

type ConfigResult = Awaited<ReturnType<typeof getAgentConfiguration>>;
type AgentResult = Awaited<ReturnType<typeof getAgent>>;

const configOk = (data = mockAgentConfigPatch) => ({ data, response: { status: 200 } }) as unknown as ConfigResult;
const configFailed = (status: number, message: string) =>
    ({ error: { error: 'x', message }, response: { status } }) as unknown as ConfigResult;
const agentOk = (data = mockAgent) => ({ data, response: { status: 200 } }) as unknown as AgentResult;
const agentFailed = (status: number, message: string) =>
    ({ error: { error: 'x', message }, response: { status } }) as unknown as AgentResult;

describe('AgentDetailsPanel', () => {
    let container: HTMLElement;
    let widget: AgentDetailsPanel;
    let chevron: HTMLButtonElement;

    const aside = () => container.querySelector<HTMLElement>('#side-panel')!;
    const section = (id: string) => container.querySelector<HTMLElement>(`#side-panel-section-${id}`)!;
    const title = () => container.querySelector('#side-panel-title')?.textContent;
    const configCalls = () => vi.mocked(getAgentConfiguration).mock.calls;
    const agentCalls = () => vi.mocked(getAgent).mock.calls;

    beforeEach(() => {
        vi.mocked(getAgentConfiguration).mockReset().mockResolvedValue(configOk());
        vi.mocked(getAgent).mockReset().mockImplementation((async (options: { path: { agentId: string } }) =>
            agentOk(mockAgents.concat(mockAgent).find(a => a.id === options.path.agentId) ?? mockAgent)) as unknown as typeof getAgent);
        vi.mocked(getValidAccessToken).mockReset().mockResolvedValue('st_live_token');
        vi.spyOn(console, 'error').mockImplementation(() => { });

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

    it('shows a loading state and no list data while the agent is being fetched', () => {
        vi.mocked(getAgent).mockReturnValue(new Promise(() => { }) as ReturnType<typeof getAgent>);
        setAgents(mockAgents);
        openAgentDetails(mockAgent.id);

        expect(aside().classList.contains('side-panel--open')).toBe(true);
        expect(title()).toBe('Agent details');
        expect(section('general').textContent).toContain('Loading...');
        expect(section('general').textContent).not.toContain(mockAgent.id);
        expect(section('network').textContent).toContain('Loading...');
        expect(section('network').textContent).not.toContain('192.168.1.100');
    });

    it('fetches the agent on open and renders General and Network from the response', async () => {
        openAgentDetails(mockAgent.id);

        expect(agentCalls()).toHaveLength(1);
        expect(agentCalls()[0]?.[0]?.path).toEqual({ agentId: mockAgent.id });

        await vi.waitFor(() => expect(title()).toBe(mockAgent.name));
        expect(section('general').hidden).toBe(false);
        expect(section('general').textContent).toContain(mockAgent.id);
        expect(section('network').hidden).toBe(false);
        expect(section('network').textContent).toContain('192.168.1.100');
        expect(section('config').hidden).toBe(true);
        expect(container.querySelector('#side-panel-toggle-config')?.textContent).toContain('Config patch preview');
        expect(configCalls()).toHaveLength(0);
    });

    // Regression: the status used to be derived from a stale list entry and showed "Offline".
    it('shows the status of the fetched agent, not of a stale list entry', async () => {
        setAgents([{ ...mockAgent, last_seen_at: new Date(Date.now() - 60 * 60 * 1000) }]);
        vi.mocked(getAgent).mockResolvedValue(agentOk({ ...mockAgent, last_seen_at: new Date() }));

        openAgentDetails(mockAgent.id);

        await vi.waitFor(() => expect(section('general').textContent).toContain('Online'));
        expect(section('general').textContent).not.toContain('Offline');
    });

    it('does not follow later changes of the agent list', async () => {
        setAgents(mockAgents);
        openAgentDetails(mockAgent.id);
        await vi.waitFor(() => expect(title()).toBe(mockAgent.name));

        setAgents(mockAgents.map(a => (a.id === mockAgent.id ? { ...a, name: 'Renamed' } : a)));

        expect(title()).toBe(mockAgent.name);
        expect(agentCalls()).toHaveLength(1);
    });

    it('does not close when the agent is absent from the list', async () => {
        setAgents([]);
        openAgentDetails(mockAgent.id);
        await vi.waitFor(() => expect(title()).toBe(mockAgent.name));

        expect(getAgentDetailsPanelState().agentId).toBe(mockAgent.id);
        expect(aside().classList.contains('side-panel--open')).toBe(true);
    });

    it('shows the server error in General with Retry and in Network without it, then retries', async () => {
        vi.mocked(getAgent).mockResolvedValueOnce(agentFailed(404, 'agent not found'));
        openAgentDetails(mockAgent.id);

        await vi.waitFor(() => expect(section('general').textContent).toContain('agent not found'));
        expect(title()).toBe('Agent details');
        expect(section('general').querySelector('[role="alert"]')).toBeTruthy();
        expect(section('network').textContent).toContain('agent not found');
        expect(section('network').querySelector('[data-action="retry-agent"]')).toBeNull();

        section('general').querySelector<HTMLButtonElement>('[data-action="retry-agent"]')!.click();

        expect(agentCalls()).toHaveLength(2);
        await vi.waitFor(() => expect(section('general').textContent).toContain(mockAgent.id));
    });

    it('expands the config section and fetches it when requested', async () => {
        openAgentDetails(mockAgent.id, { expandConfig: true });

        expect(section('config').hidden).toBe(false);
        expect(configCalls()).toHaveLength(1);
        expect(configCalls()[0]?.[0]?.path).toEqual({ agentId: mockAgent.id });

        await vi.waitFor(() => expect(section('config').textContent).toContain('interval_secs'));
        expect(section('config').textContent).toContain('production');
    });

    it('shows a loading state while the config request is in flight', () => {
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
        expect(agentCalls()).toHaveLength(1);
    });

    it('refetches agent and config for the new agent on a swap while the config section is expanded', async () => {
        const other = mockAgents[1]!;
        openAgentDetails(mockAgent.id, { expandConfig: true });
        await vi.waitFor(() => expect(getAgentConfigState().status).toBe('loaded'));

        vi.mocked(getAgentConfiguration).mockResolvedValue(
            configOk({ ...mockAgentConfigPatch, id: other.id, name: other.name, config_version_desired: other.config_version_desired })
        );
        openAgentDetails(other.id);

        expect(title()).toBe('Agent details');
        expect(agentCalls()).toHaveLength(2);
        expect(agentCalls()[1]?.[0]?.path).toEqual({ agentId: other.id });
        expect(configCalls()).toHaveLength(2);
        expect(configCalls()[1]?.[0]?.path).toEqual({ agentId: other.id });
        await vi.waitFor(() => expect(title()).toBe(other.name));
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

    it('shows the server error message and retries the config on demand', async () => {
        vi.mocked(getAgentConfiguration).mockResolvedValueOnce(configFailed(404, 'agent has no stored configuration'));
        openAgentDetails(mockAgent.id, { expandConfig: true });

        await vi.waitFor(() => expect(section('config').textContent).toContain('agent has no stored configuration'));
        expect(section('config').querySelector('[role="alert"]')).toBeTruthy();

        section('config').querySelector<HTMLButtonElement>('[data-action="retry-config"]')!.click();

        expect(configCalls()).toHaveLength(2);
        await vi.waitFor(() => expect(section('config').textContent).toContain('interval_secs'));
        expect(agentCalls()).toHaveLength(1);
    });

    it('resets agent and config on close and refetches both when reopened', async () => {
        openAgentDetails(mockAgent.id, { expandConfig: true });
        await vi.waitFor(() => expect(getAgentConfigState().status).toBe('loaded'));
        await vi.waitFor(() => expect(getAgentDetailsState().status).toBe('loaded'));

        closeAgentDetails();
        expect(getAgentConfigState().status).toBe('idle');
        expect(getAgentDetailsState().status).toBe('idle');

        openAgentDetails(mockAgent.id);
        expect(section('config').hidden).toBe(false);
        expect(agentCalls()).toHaveLength(2);
        expect(configCalls()).toHaveLength(2);
        await vi.waitFor(() => expect(getAgentConfigState().status).toBe('loaded'));
    });

    it('ignores an agent response that arrives after close', async () => {
        let resolve!: (value: AgentResult) => void;
        vi.mocked(getAgent).mockReturnValue(new Promise<AgentResult>(r => { resolve = r; }) as ReturnType<typeof getAgent>);
        openAgentDetails(mockAgent.id);
        closeAgentDetails();

        resolve(agentOk());
        await Promise.resolve();

        expect(getAgentDetailsState().status).toBe('idle');
        expect(section('general').textContent?.trim()).toBe('');
    });

    it('does not fetch the config on reopen when the user collapsed the config section', async () => {
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
        expect(getAgentDetailsState().status).toBe('idle');
        resetAgentConfig();
    });
});
