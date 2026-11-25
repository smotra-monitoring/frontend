/**
 * State for the agent shown in the details panel.
 * Fetched on open/swap only and independent of the agent list, so the panel never shows
 * a status derived from a stale list entry. Never refetched automatically.
 */

import { createState, type Subscriber, type UnsubscribeFn } from './global-state.js';
import type { AgentDetailsState } from '../types/agent-details-types.js';
import { getAgent } from '../api/index.js';
import { getValidAccessToken } from '../auth/token-manager.js';

const FALLBACK_MESSAGE = 'Failed to load agent details';

function initialState(): AgentDetailsState {
    return { agentId: null, status: 'idle', data: null, error: null };
}

const detailsState = createState<AgentDetailsState>(initialState());

let latestRequestId = 0;

export function getAgentDetailsState(): AgentDetailsState {
    return detailsState.getState();
}

export function subscribeToAgentDetails(callback: Subscriber<AgentDetailsState>): UnsubscribeFn {
    return detailsState.subscribe(callback);
}

/** Clear the entry and ignore any request still in flight. */
export function resetAgentDetails(): void {
    latestRequestId++;
    detailsState.reset(initialState());
}

/**
 * Fetch one agent. Never throws; failures are stored in `error` with the server's message.
 * A response that arrives after a newer load (or a reset) is discarded.
 */
export async function loadAgentDetails(agentId: string): Promise<void> {
    const requestId = ++latestRequestId;
    detailsState.reset({ agentId, status: 'loading', data: null, error: null });

    try {
        const { data, error, response } = await getAgent({
            path: { agentId },
            auth: async () => (await getValidAccessToken()) ?? undefined,
        });

        if (requestId !== latestRequestId) return;

        if (error || !data) {
            const detailsError = { message: error?.message ?? FALLBACK_MESSAGE, status: response?.status };
            console.error('Failed to load agent details (resolve branch)', agentId, detailsError);
            detailsState.setState({ status: 'error', error: detailsError });
            return;
        }

        detailsState.setState({ status: 'loaded', data, error: null });
    } catch (thrown) {
        if (requestId !== latestRequestId) return;
        const detailsError = { message: thrown instanceof Error ? thrown.message : FALLBACK_MESSAGE };
        console.error('Failed to load agent details (reject branch)', agentId, detailsError);
        detailsState.setState({ status: 'error', error: detailsError });
    }
}
