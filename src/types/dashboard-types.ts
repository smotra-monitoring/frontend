/**
 * Dashboard and agent monitoring type definitions
 */

// Re-export generated types from OpenAPI SDK (DO NOT recreate these types)
import type { AgentListItem, AgentNetworkInterface } from '../api/types.gen.js';
export type Agent = AgentListItem;
export type { AgentNetworkInterface };

// UI-specific derived status (computed from lastSeenAt threshold)
export type DerivedAgentStatus = 'online' | 'offline' | 'unknown';

// Legacy type alias for backward compatibility during migration
export type AgentStatus = DerivedAgentStatus;

export interface AgentListState {
  agents: Agent[];
  filter: FilterOptions;
  sort: SortOptions;
  viewMode: ViewMode;
  selectedAgent: string | null;
  loading: boolean;
}

export interface FilterOptions {
  status?: DerivedAgentStatus | DerivedAgentStatus[];
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

export interface AgentUpdate {
  id: string;
  status?: DerivedAgentStatus;
  lastSeenAt?: Date;
  agentVersion?: string;
  configVersion?: number;
}

export interface DashboardConfig {
  refreshInterval: number; // milliseconds
  autoRefresh: boolean;
  columnsPerRow: 'auto' | number;
}
