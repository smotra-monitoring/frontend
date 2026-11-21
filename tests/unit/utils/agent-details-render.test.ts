import { describe, it, expect } from 'vitest';
import { renderAgentGeneral, renderAgentNetwork } from '../../../src/utils/agent-details-render.js';
import { mockAgent } from '../../mocks/agent-data.js';

describe('renderAgentGeneral', () => {
    it('renders identity, versions and timestamps', () => {
        const html = renderAgentGeneral(mockAgent);

        expect(html).toContain(mockAgent.id);
        expect(html).toContain(mockAgent.workspace_id);
        expect(html).toContain('1.0.0');
        expect(html).toContain('3 / 3');
        expect(html).toContain('Online');
    });

    it('shows placeholders for values the agent has not reported', () => {
        const html = renderAgentGeneral({
            ...mockAgent,
            agent_version: null,
            config_version_current: null,
            last_seen_at: null,
            last_result_submitted_at: null,
        });

        expect(html).toContain('Unknown');
        expect(html).toContain('Not reported / 3');
        expect(html).toContain('N/A');
        expect(html).toContain('Not reported');
    });

    it('escapes agent-provided values', () => {
        const payload = '"><img src=x onerror=alert(1)>';
        const html = renderAgentGeneral({ ...mockAgent, agent_version: payload });

        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });
});

describe('renderAgentNetwork', () => {
    it('lists addresses and marks the recommended one', () => {
        const html = renderAgentNetwork(mockAgent);

        expect(html).toContain('192.168.1.100');
        expect(html).toContain('eth0, recommended');
    });

    it('shows a placeholder without addresses', () => {
        expect(renderAgentNetwork({ ...mockAgent, ip_addresses: [] })).toContain('No IP addresses reported');
        expect(renderAgentNetwork({ ...mockAgent, ip_addresses: undefined })).toContain('No IP addresses reported');
    });

    it('escapes interface names', () => {
        const html = renderAgentNetwork({
            ...mockAgent,
            ip_addresses: [{ ip: '10.0.0.1', iface: '<b>x</b>', family: 'ipv4', recommended: false }],
        });

        expect(html).not.toContain('<b>');
        expect(html).toContain('&lt;b&gt;');
    });
});
