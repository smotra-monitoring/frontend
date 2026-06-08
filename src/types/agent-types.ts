/**
 * Dashboard and agent monitoring type definitions
 */

// Re-export generated types from OpenAPI SDK (DO NOT recreate these types)
import type { Agent, AgentNetworkInterface } from '../api/types.gen.js';
export type { Agent };
export type { AgentNetworkInterface };

// UI-specific derived status (computed from lastSeenAt threshold)
export type AgentStatus = 'online' | 'offline' | 'unknown';

export interface AgentListState {
  agents: Agent[];
  filter: FilterOptions;
  sort: SortOptions;
  viewMode: ViewMode;
  selectedAgent: string | null;
  loading: boolean;
}

export interface FilterOptions {
  status?: AgentStatus | AgentStatus[];
  sectionId?: string;
  agentVersion?: string;
  tags?: string[];
  search?: string;
}

export interface SortOptions {
  field: SortField;
  direction: 'asc' | 'desc';
}

export type SortField = 'name' | 'status' | 'lastSeenAt' | 'agentVersion' | 'configVersion';

export type ViewMode = 'grid' | 'list' | 'table';
