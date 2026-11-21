import { describe, it, expect } from 'vitest';
import type { AgentConfigState } from '../../../src/types/agent-config-types.js';
import { renderAgentConfig } from '../../../src/utils/agent-config-render.js';
import { isConfigStale } from '../../../src/utils/agent-config-utils.js';
import { mockAgent, mockAgentConfigPatch } from '../../mocks/agent-data.js';

const loaded: AgentConfigState = {
    agentId: mockAgent.id,
    status: 'loaded',
    data: mockAgentConfigPatch,
    error: null,
    fetchedForVersion: mockAgentConfigPatch.config_version_desired,
};

describe('isConfigStale', () => {
    it('is false when versions match', () => {
        expect(isConfigStale(loaded, mockAgent)).toBe(false);
    });

    it('is true when the list reports a different version, in either direction', () => {
        expect(isConfigStale(loaded, { ...mockAgent, config_version_desired: BigInt(4) })).toBe(true);
        expect(isConfigStale(loaded, { ...mockAgent, config_version_desired: BigInt(2) })).toBe(true);
    });

    it('is false when not loaded, without an agent, or for another agent', () => {
        expect(isConfigStale({ ...loaded, status: 'loading' }, { ...mockAgent, config_version_desired: BigInt(9) })).toBe(false);
        expect(isConfigStale(loaded, null)).toBe(false);
        expect(isConfigStale(loaded, { ...mockAgent, id: 'other', config_version_desired: BigInt(9) })).toBe(false);
    });
});

describe('renderAgentConfig', () => {
    it('renders nothing when idle', () => {
        expect(renderAgentConfig({ ...loaded, status: 'idle', data: null })).toBe('');
    });

    it('renders a polite loading region', () => {
        const html = renderAgentConfig({ ...loaded, status: 'loading', data: null });
        expect(html).toContain('aria-live="polite"');
        expect(html).toContain('Loading configuration');
    });

    it('renders version, tags, endpoints and the base config', () => {
        const html = renderAgentConfig(loaded, mockAgent);
        expect(html).toContain('<dd>3</dd>');
        expect(html).toContain('production');
        expect(html).toContain('10.0.0.1:443');
        expect(html).toContain('example.com');
        expect(html).toContain('disabled');
        expect(html).toContain('&quot;interval_secs&quot;: 30');
        expect(html).not.toContain('reload-config');
    });

    it('renders placeholders for empty tags, endpoints and patch', () => {
        const html = renderAgentConfig({
            ...loaded,
            data: { ...mockAgentConfigPatch, tags: [], endpoints: [], base_config: {} },
        });
        expect(html).toContain('No tags');
        expect(html).toContain('No endpoints');
        expect(html).toContain('Empty patch');
    });

    it('escapes server-provided values (XSS)', () => {
        const payload = '"><img src=x onerror=alert(1)>';
        const html = renderAgentConfig({
            ...loaded,
            data: {
                ...mockAgentConfigPatch,
                tags: [payload],
                endpoints: [{ id: 'e', address: payload, enabled: true, tags: [payload] }],
                base_config: { key: payload },
            },
        });
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });

    it('shows the stale banner with both versions and a reload button', () => {
        const html = renderAgentConfig(loaded, { ...mockAgent, config_version_desired: BigInt(5) });
        expect(html).toContain('Agent list shows version 5, this view shows 3.');
        expect(html).toContain('data-action="reload-config"');
    });

    it('shows the server message in an alert with a retry button', () => {
        const html = renderAgentConfig({
            ...loaded,
            status: 'error',
            data: null,
            error: { message: 'Agent 01930000 has no stored configuration', status: 404 },
        });
        expect(html).toContain('role="alert"');
        expect(html).toContain('Agent 01930000 has no stored configuration');
        expect(html).toContain('data-action="retry-config"');
    });

    it('escapes the error message', () => {
        const html = renderAgentConfig({
            ...loaded,
            status: 'error',
            data: null,
            error: { message: '<img src=x onerror=alert(1)>' },
        });
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });
});
