import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    closeAgentDetails,
    getAgentDetailsPanelState,
    openAgentDetails,
    subscribeToAgentDetailsPanel,
} from '../../../src/state/agent-details-panel-state.js';

describe('agent-details-panel-state', () => {
    beforeEach(() => {
        closeAgentDetails();
    });

    it('is closed by default', () => {
        expect(getAgentDetailsPanelState().agentId).toBeNull();
    });

    it('opens for an agent without requesting the config section', () => {
        const before = getAgentDetailsPanelState().configRequest;
        openAgentDetails('agent-a');

        expect(getAgentDetailsPanelState()).toEqual({ agentId: 'agent-a', configRequest: before });
    });

    it('increments the config request on every expandConfig open, even for the same agent', () => {
        const before = getAgentDetailsPanelState().configRequest;
        openAgentDetails('agent-a', { expandConfig: true });
        openAgentDetails('agent-a', { expandConfig: true });

        expect(getAgentDetailsPanelState().configRequest).toBe(before + 2);
    });

    it('swaps the agent while open', () => {
        openAgentDetails('agent-a');
        openAgentDetails('agent-b');

        expect(getAgentDetailsPanelState().agentId).toBe('agent-b');
    });

    it('closes and keeps the config request counter', () => {
        openAgentDetails('agent-a', { expandConfig: true });
        const { configRequest } = getAgentDetailsPanelState();
        closeAgentDetails();

        expect(getAgentDetailsPanelState()).toEqual({ agentId: null, configRequest });
    });

    it('does not notify when closing an already closed panel', () => {
        const callback = vi.fn();
        const unsubscribe = subscribeToAgentDetailsPanel(callback);

        closeAgentDetails();
        expect(callback).not.toHaveBeenCalled();

        openAgentDetails('agent-a');
        expect(callback).toHaveBeenCalledTimes(1);
        unsubscribe();
    });
});
