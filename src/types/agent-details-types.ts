/**
 * Agent details panel type definitions
 */

import type { Agent } from './agent-types.js';

export type AgentDetailsStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface AgentDetailsError {
  /** Message returned by the server, or the thrown error's message when no response was received. */
  message: string;
  /** HTTP status; undefined when no response was received. */
  status?: number;
}

/** The one agent currently shown in the details panel, fetched independently of the agent list. */
export interface AgentDetailsState {
  agentId: string | null;
  status: AgentDetailsStatus;
  data: Agent | null;
  error: AgentDetailsError | null;
}
