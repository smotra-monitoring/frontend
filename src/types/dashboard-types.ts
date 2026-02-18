/**
 * Dashboard and agent monitoring type definitions
 */

export interface Agent {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  ipAddress?: string; // Alias for ip
  status: AgentStatus;
  lastSeen: number; // Unix timestamp
  metrics: AgentMetrics;
  tags: string[];
  version: string;
}

export type AgentStatus = 'online' | 'offline' | 'warning' | 'error' | 'unknown';

export interface AgentMetrics {
  latency: number; // milliseconds
  uptime: number; // seconds
  reachability: number; // percentage 0-100
  responseTime: number; // milliseconds
  lastCheck: number; // Unix timestamp
  lastSeen?: number; // Unix timestamp - optional for backward compat
}

export interface AgentCardData {
  agent: Agent;
  expanded: boolean;
  loading: boolean;
}

export interface DashboardState {
  agents: Agent[];
  filter: FilterOptions;
  sort: SortOptions;
  viewMode: ViewMode;
  selectedAgent: string | null;
  loading: boolean;
}

export interface FilterOptions {
  status?: AgentStatus | AgentStatus[];
  hostname?: string;
  tags?: string[];
  search?: string;
}

export interface SortOptions {
  field: SortField;
  direction: 'asc' | 'desc';
}

export type SortField = 'name' | 'status' | 'latency' | 'uptime' | 'lastSeen';

export type ViewMode = 'grid' | 'list' | 'table';

export interface AgentUpdate {
  id: string;
  status?: AgentStatus;
  metrics?: Partial<AgentMetrics>;
  lastSeen?: number;
}

export interface DashboardConfig {
  refreshInterval: number; // milliseconds
  autoRefresh: boolean;
  columnsPerRow: 'auto' | number;
}
