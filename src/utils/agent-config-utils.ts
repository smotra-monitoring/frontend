/**
 * Helpers for comparing the fetched configuration patch with the agent list
 */

import type { AgentConfigState } from '../types/agent-config-types.js';
import type { Agent } from '../types/agent-types.js';

/** True when the agent list reports a different desired version than the one fetched. */
export function isConfigStale(state: AgentConfigState, agent: Agent | null): boolean {
    return (
        state.status === 'loaded' &&
        agent !== null && agent.id === state.agentId &&
        agent.config_version_desired !== state.fetchedForVersion
    );
}
