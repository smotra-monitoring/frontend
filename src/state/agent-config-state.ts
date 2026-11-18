/**
 * State for the configuration patch of the agent being inspected.
 * Fetched on demand only; never refetched automatically so the view does not change under the user.
 */

import { createState, type Subscriber, type UnsubscribeFn } from './global-state.js';
import type { AgentConfigState } from '../types/agent-config-types.js';
import { getAgentConfiguration } from '../api/index.js';
import { getValidAccessToken } from '../auth/token-manager.js';
import { describeConfigError } from '../utils/agent-config-errors.js';

function initialState(): AgentConfigState {
    return { agentId: null, status: 'idle', data: null, error: null, fetchedForVersion: null };
}

const configState = createState<AgentConfigState>(initialState());

let latestRequestId = 0;

export function getAgentConfigState(): AgentConfigState {
    return configState.getState();
}

export function subscribeToAgentConfig(callback: Subscriber<AgentConfigState>): UnsubscribeFn {
    return configState.subscribe(callback);
}

/** Clear the entry and ignore any request still in flight. */
export function resetAgentConfig(): void {
    latestRequestId++;
    configState.reset(initialState());
}

/**
 * Fetch the stored configuration patch of an agent. Never throws; failures are stored in `error`.
 * A response that arrives after a newer load (or a reset) is discarded.
 */
export async function loadAgentConfig(agentId: string): Promise<void> {
    const requestId = ++latestRequestId;
    configState.reset({ agentId, status: 'loading', data: null, error: null, fetchedForVersion: null });

    try {
        const { data, error, response } = await getAgentConfiguration({
            path: { agentId },
            auth: async () => (await getValidAccessToken()) ?? undefined,
        });

        if (requestId !== latestRequestId) return;

        if (error || !data) {
            console.error('Failed to load agent configuration (resolve branch)', agentId, describeConfigError(response?.status));
            configState.setState({ status: 'error', error: describeConfigError(response?.status) });
            return;
        }

        configState.setState({
            status: 'loaded',
            data,
            error: null,
            fetchedForVersion: data.config_version_desired,
        });
    } catch {
        if (requestId !== latestRequestId) return;
        console.error('Failed to load agent configuration (reject branch)', agentId, describeConfigError(undefined));
        configState.setState({ status: 'error', error: describeConfigError(undefined) });
    }
}
