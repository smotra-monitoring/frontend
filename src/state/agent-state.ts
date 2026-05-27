/**
 * Agent monitoring data state management
 */

import { createState, type Subscriber, type UnsubscribeFn } from './global-state.js';
import type { Agent, AgentListState, FilterOptions, SortOptions, AgentUpdate, ViewMode } from '../types/dashboard-types.js';

// Initial dashboard state
const initialDashboardState: AgentListState = {
  agents: [],
  filter: {},
  sort: {
    field: 'name',
    direction: 'asc',
  },
  viewMode: 'grid' as ViewMode,
  selectedAgent: null,
  loading: false
};

// Create dashboard state instance
const dashboardState = createState<AgentListState>(initialDashboardState);

/**
 * Set agents list
 */
export function setAgents(agents: Agent[]): void {
  dashboardState.setState({ agents });
}

/**
 * Add single agent
 */
export function addAgent(agent: Agent): void {
  const current = dashboardState.getState();
  const agents = [...current.agents];
  const existingIndex = agents.findIndex(a => a.id === agent.id);

  if (existingIndex === -1) {
    agents.push(agent);
  } else {
    agents[existingIndex] = agent;
  }

  dashboardState.setState({ agents });
}

/**
 * Update single agent
 */
export function updateAgent(update: AgentUpdate): void {
  const current = dashboardState.getState();
  const agents = current.agents.map(agent => {
    if (agent.id === update.id) {
      return {
        ...agent,
        ...(update.status && { status: update.status }),
        ...(update.metrics && { metrics: { ...agent.metrics, ...update.metrics } }),
        ...(update.lastSeen && { lastSeen: update.lastSeen }),
      };
    }
    return agent;
  });
  dashboardState.setState({ agents });
}

/**
 * Remove agent
 */
export function removeAgent(agentId: string): void {
  const current = dashboardState.getState();
  const agents = current.agents.filter(agent => agent.id !== agentId);
  dashboardState.setState({ agents });
}

/**
 * Set filter options
 */
export function setFilter(filter: FilterOptions): void {
  dashboardState.setState({ filter });
}

/**
 * Clear filters
 */
export function clearFilters(): void {
  dashboardState.setState({ filter: {} });
}

/**
 * Set sort options
 */
export function setSort(sort: SortOptions): void {
  dashboardState.setState({ sort });
}

/**
 * Set view mode
 */
export function setViewMode(viewMode: ViewMode): void {
  dashboardState.setState({ viewMode });
}

/**
 * Select agent
 */
export function selectAgent(agentId: string | null): void {
  dashboardState.setState({ selectedAgent: agentId });
}

/**
 * Get all agents (legacy - use getAgents)
 */
export function getAgents(): Agent[] {
  return dashboardState.getState().agents;
}

/**
 * Filter agents by criteria
 */
export function filterAgents(agents: Agent[], filter: FilterOptions): Agent[] {
  let filtered = [...agents];

  // Apply status filter
  if (filter.status) {
    if (Array.isArray(filter.status)) {
      filtered = filtered.filter(agent => filter.status!.includes(agent.status));
    } else {
      filtered = filtered.filter(agent => agent.status === filter.status);
    }
  }

  // Apply hostname filter
  if (filter.hostname) {
    filtered = filtered.filter(agent => agent.hostname === filter.hostname);
  }

  // Apply tags filter
  if (filter.tags && filter.tags.length > 0) {
    filtered = filtered.filter(agent =>
      filter.tags!.some((tag: string) => agent.tags.includes(tag))
    );
  }

  // Apply search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(agent =>
      agent.name.toLowerCase().includes(searchLower) ||
      agent.hostname.toLowerCase().includes(searchLower) ||
      agent.ip?.includes(searchLower) ||
      agent.ipAddress?.includes(searchLower)
    );
  }

  return filtered;
}

/**
 * Sort agents by field and direction
 */
export function sortAgents(agents: Agent[], sort: SortOptions): Agent[] {
  const sorted = [...agents];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sort.field) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'latency':
        aValue = a.metrics.latency;
        bValue = b.metrics.latency;
        break;
      case 'uptime':
        aValue = a.metrics.uptime;
        bValue = b.metrics.uptime;
        break;
      case 'lastSeen':
        aValue = a.lastSeen;
        bValue = b.lastSeen;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }

    if (aValue < bValue) {
      return sort.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sort.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return sorted;
}

/**
 * Subscribe to agent/dashboard state changes using internal state management (observer pattern)
 * 
 * Receives the **complete dashboard state** on every change, including:
 * - agents: full list of monitored agents
 * - filter: current filter options
 * - sort: current sort configuration
 * - viewMode: grid/list/table view mode
 * - selectedAgent: currently selected agent ID
 * - loading: loading state
 * 
 * **Use this for:**
 * - Components that render agent lists or dashboards
 * - Reacting to agent updates from WebSocket messages
 * - Monitoring filter, sort, or view mode changes
 * - Type-safe state subscriptions with full context
 * 
 * @param callback - Function called with complete dashboard state on changes
 * @returns Unsubscribe function to remove the listener
 * 
 * @example
 * ```ts
 * const unsubscribe = subscribeToAgents((state) => {
 *   console.log(`${state.agents.length} agents monitored`);
 *   console.log('View mode:', state.viewMode);
 *   // Re-render your component with new state
 * });
 * // Later: unsubscribe();
 * ```
 */
export function subscribeToAgents(callback: Subscriber<AgentListState>): UnsubscribeFn {
  return dashboardState.subscribe(callback);
}

/**
 * Get agent by ID
 */
export function getAgentById(agentId: string): Agent | null {
  const agents = dashboardState.getState().agents;
  return agents.find((agent: Agent) => agent.id === agentId) || null;
}

/**
 * Get agent count by status
 */
export function getAgentCountByStatus(): Record<string, number> {
  const agents = dashboardState.getState().agents;
  const counts: Record<string, number> = {
    online: 0,
    offline: 0,
    warning: 0,
    unknown: 0,
  };

  agents.forEach((agent: Agent) => {
    counts[agent.status] = (counts[agent.status] || 0) + 1;
  });

  return counts;
}

const now = Math.floor(Date.now() / 1000);

const fakeAgents: Agent[] = [
  {
    id: 'agent-001',
    name: 'web-prod-01',
    hostname: 'web-prod-01.infra.example.com',
    ip: '10.0.1.10',
    status: 'online',
    lastSeen: now - 5,
    metrics: { latency: 12, uptime: 2592000, reachability: 100, responseTime: 14, lastCheck: now - 5 },
    tags: ['production', 'web'],
    version: '1.4.2',
  },
  {
    id: 'agent-002',
    name: 'web-prod-02',
    hostname: 'web-prod-02.infra.example.com',
    ip: '10.0.1.11',
    status: 'online',
    lastSeen: now - 8,
    metrics: { latency: 15, uptime: 2590000, reachability: 100, responseTime: 17, lastCheck: now - 8 },
    tags: ['production', 'web'],
    version: '1.4.2',
  },
  {
    id: 'agent-003',
    name: 'api-prod-01',
    hostname: 'api-prod-01.infra.example.com',
    ip: '10.0.2.10',
    status: 'online',
    lastSeen: now - 3,
    metrics: { latency: 8, uptime: 1728000, reachability: 99.9, responseTime: 10, lastCheck: now - 3 },
    tags: ['production', 'api'],
    version: '1.4.2',
  },
  {
    id: 'agent-004',
    name: 'db-primary',
    hostname: 'db-primary.infra.example.com',
    ip: '10.0.3.10',
    status: 'warning',
    lastSeen: now - 45,
    metrics: { latency: 142, uptime: 5184000, reachability: 97.3, responseTime: 155, lastCheck: now - 45 },
    tags: ['production', 'database'],
    version: '1.3.9',
  },
  {
    id: 'agent-005',
    name: 'db-replica-01',
    hostname: 'db-replica-01.infra.example.com',
    ip: '10.0.3.11',
    status: 'online',
    lastSeen: now - 12,
    metrics: { latency: 18, uptime: 4320000, reachability: 100, responseTime: 20, lastCheck: now - 12 },
    tags: ['production', 'database'],
    version: '1.4.0',
  },
  {
    id: 'agent-006',
    name: 'cache-01',
    hostname: 'cache-01.infra.example.com',
    ip: '10.0.4.10',
    status: 'online',
    lastSeen: now - 2,
    metrics: { latency: 3, uptime: 864000, reachability: 100, responseTime: 4, lastCheck: now - 2 },
    tags: ['production', 'cache'],
    version: '1.4.2',
  },
  {
    id: 'agent-007',
    name: 'worker-staging-01',
    hostname: 'worker-staging-01.infra.example.com',
    ip: '10.1.1.10',
    status: 'offline',
    lastSeen: now - 3720,
    metrics: { latency: 0, uptime: 0, reachability: 0, responseTime: 0, lastCheck: now - 3720 },
    tags: ['staging', 'worker'],
    version: '1.5.0-beta',
  },
  {
    id: 'agent-008',
    name: 'monitor-eu-01',
    hostname: 'monitor-eu-01.infra.example.com',
    ip: '185.12.44.100',
    status: 'online',
    lastSeen: now - 20,
    metrics: { latency: 68, uptime: 3456000, reachability: 99.5, responseTime: 72, lastCheck: now - 20 },
    tags: ['monitoring', 'eu-west'],
    version: '1.4.1',
  },
  {
    id: 'agent-009',
    name: 'monitor-us-01',
    hostname: 'monitor-us-01.infra.example.com',
    ip: '54.210.33.77',
    status: 'online',
    lastSeen: now - 18,
    metrics: { latency: 34, uptime: 3456000, reachability: 99.8, responseTime: 37, lastCheck: now - 18 },
    tags: ['monitoring', 'us-east'],
    version: '1.4.1',
  },
  {
    id: 'agent-010',
    name: 'edge-cdn-01',
    hostname: 'edge-cdn-01.infra.example.com',
    ip: '104.21.55.200',
    status: 'error',
    lastSeen: now - 610,
    metrics: { latency: 999, uptime: 0, reachability: 12, responseTime: 999, lastCheck: now - 610 },
    tags: ['cdn', 'edge'],
    version: '1.4.0',
  },
];

/**
 * Load agents from API
 * TODO: Replace fake data with actual API call when backend is ready
 */
export async function loadAgents(): Promise<void> {
  try {
    // Future: const response = await fetch('/api/v1/agents');
    // Future: const agents = await response.json();
    // Future: setAgents(agents);

    // Temporary: seed with fake agents for UI development
    setAgents(fakeAgents);
  } catch (error) {
    console.error('Failed to load agents:', error);
    throw error;
  }
}
