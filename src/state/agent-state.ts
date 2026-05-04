/**
 * Agent monitoring data state management
 */

import { createState, type Subscriber, type UnsubscribeFn } from './global-state.js';
import type { Agent, DashboardState, FilterOptions, SortOptions, AgentUpdate, ViewMode } from '../types/dashboard-types.js';

// Initial dashboard state
const initialDashboardState: DashboardState = {
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
const dashboardState = createState<DashboardState>(initialDashboardState);

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

  if (existingIndex !== -1) {
    agents[existingIndex] = agent;
  } else {
    agents.push(agent);
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
export function subscribeToAgents(callback: Subscriber<DashboardState>): UnsubscribeFn {
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

/**
 * Load agents from API
 * TODO: Implement actual API call when backend is ready
 */
export async function loadAgents(): Promise<void> {
  // For now, this is a stub. In production, it would fetch from API
  // The WebSocket will provide real-time updates after initial load
  try {
    // Future: const response = await fetch('/api/v1/agents');
    // Future: const agents = await response.json();
    // Future: setAgents(agents);

    // For now, just resolve - WebSocket will populate data
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to load agents:', error);
    throw error;
  }
}
