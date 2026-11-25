import { describe, it, expect } from 'vitest';
import { renderAgentGeneral, renderAgentNetwork } from '../../../src/utils/agent-details-render.js';
import type { Agent } from '../../../src/types/agent-types.js';
import type { AgentDetailsState } from '../../../src/types/agent-details-types.js';
import { mockAgent } from '../../mocks/agent-data.js';

const state = (patch: Partial<AgentDetailsState>): AgentDetailsState =>
    ({ agentId: mockAgent.id, status: 'idle', data: null, error: null, ...patch });

const loaded = (agent: Agent = mockAgent): AgentDetailsState => state({ status: 'loaded', data: agent });

describe.each([
    ['renderAgentGeneral', renderAgentGeneral, true],
    ['renderAgentNetwork', renderAgentNetwork, false],
])('%s placeholders', (_name, render, hasRetry) => {
    it('renders a polite loading region without a retry button', () => {
        const html = render(state({ status: 'loading' }));

        expect(html).toContain('aria-live="polite"');
        expect(html).toContain('Loading...');
        expect(html).not.toContain('retry-agent');
    });

    it(`renders the error message in an alert ${hasRetry ? 'with' : 'without'} a retry button`, () => {
        const html = render(state({ status: 'error', error: { message: 'agent not found', status: 404 } }));

        expect(html).toContain('role="alert"');
        expect(html).toContain('agent not found');
        expect(html.includes('data-action="retry-agent"')).toBe(hasRetry);
    });

    it('escapes the error message', () => {
        const html = render(state({ status: 'error', error: { message: '<img src=x>' } }));

        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });

    it('renders nothing when idle', () => {
        expect(render(state({ status: 'idle' }))).toBe('');
    });
});

describe('renderAgentGeneral', () => {
    it('renders identity, versions and timestamps', () => {
        const html = renderAgentGeneral(loaded());

        expect(html).toContain(mockAgent.id);
        expect(html).toContain(mockAgent.workspace_id);
        expect(html).toContain('1.0.0');
        expect(html).toContain('3 / 3');
        expect(html).toContain('Online');
    });

    it('shows placeholders for values the agent has not reported', () => {
        const html = renderAgentGeneral(loaded({
            ...mockAgent,
            agent_version: null,
            config_version_current: null,
            last_seen_at: null,
            last_result_submitted_at: null,
        }));

        expect(html).toContain('Unknown');
        expect(html).toContain('Not reported / 3');
        expect(html).toContain('N/A');
        expect(html).toContain('Not reported');
    });

    it('escapes agent-provided values', () => {
        const payload = '"><img src=x onerror=alert(1)>';
        const html = renderAgentGeneral(loaded({ ...mockAgent, agent_version: payload }));

        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });
});

describe('renderAgentNetwork', () => {
    it('lists addresses and marks the recommended one', () => {
        const html = renderAgentNetwork(loaded());

        expect(html).toContain('192.168.1.100');
        expect(html).toContain('eth0, recommended');
    });

    it('shows a placeholder without addresses', () => {
        expect(renderAgentNetwork(loaded({ ...mockAgent, ip_addresses: [] }))).toContain('No IP addresses reported');
        expect(renderAgentNetwork(loaded({ ...mockAgent, ip_addresses: undefined }))).toContain('No IP addresses reported');
    });

    it('escapes interface names', () => {
        const html = renderAgentNetwork(loaded({
            ...mockAgent,
            ip_addresses: [{ ip: '10.0.0.1', iface: '<b>x</b>', family: 'ipv4', recommended: false }],
        }));

        expect(html).not.toContain('<b>');
        expect(html).toContain('&lt;b&gt;');
    });
});
