/**
 * State of the agent details side panel: which agent it shows, if any.
 * This is the single source of truth for the selected row in the agent table.
 */

import { createState, type Subscriber, type UnsubscribeFn } from './global-state.js';

export interface AgentDetailsPanelState {
    /** Agent shown in the panel; null when the panel is closed. */
    agentId: string | null;
    /** Incremented on every request to expand the config section, so repeated requests re-trigger. */
    configRequest: number;
}

const panelState = createState<AgentDetailsPanelState>({ agentId: null, configRequest: 0 });

export function getAgentDetailsPanelState(): AgentDetailsPanelState {
    return panelState.getState();
}

export function subscribeToAgentDetailsPanel(callback: Subscriber<AgentDetailsPanelState>): UnsubscribeFn {
    return panelState.subscribe(callback);
}

/** Open the panel for an agent, or swap its content if already open. */
export function openAgentDetails(agentId: string, options: { expandConfig?: boolean } = {}): void {
    const { configRequest } = panelState.getState();
    panelState.setState({
        agentId,
        configRequest: options.expandConfig ? configRequest + 1 : configRequest,
    });
}

export function closeAgentDetails(): void {
    if (panelState.getState().agentId === null) return;
    panelState.setState({ agentId: null });
}
