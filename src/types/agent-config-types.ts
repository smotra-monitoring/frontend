/**
 * Agent configuration patch type definitions
 */

// Re-export generated type from OpenAPI SDK (DO NOT recreate this type)
import type { AgentConfigPatch } from '../api/types.gen.js';
export type { AgentConfigPatch };

export type AgentConfigStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface AgentConfigError {
  /** Message returned by the server, or the thrown error's message when no response was received. */
  message: string;
  /** HTTP status; undefined when no response was received. */
  status?: number;
}

/** Configuration of the one agent currently being inspected. */
export interface AgentConfigState {
  agentId: string | null;
  status: AgentConfigStatus;
  data: AgentConfigPatch | null;
  error: AgentConfigError | null;
  /** `config_version_desired` of the fetched patch; used to detect a stale view. */
  fetchedForVersion: bigint | null;
}
