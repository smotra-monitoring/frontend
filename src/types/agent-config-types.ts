/**
 * Agent configuration patch type definitions
 */

// Re-export generated type from OpenAPI SDK (DO NOT recreate this type)
import type { AgentConfigPatch } from '../api/types.gen.js';
export type { AgentConfigPatch };

export type AgentConfigStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type AgentConfigErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'notImplemented'
  | 'unavailable'
  | 'network'
  | 'unknown';

export interface AgentConfigError {
  kind: AgentConfigErrorKind;
  message: string;
  /** HTTP status; undefined when no response was received. */
  status?: number;
  retryable: boolean;
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
