/**
 * Agent monitoring data state management
 */

import { createState, type Subscriber, type UnsubscribeFn } from './global-state.js';
import type { Agent, AgentListState, FilterOptions, SortOptions, ViewMode } from '../types/agent-types.js';
import { deriveAgentStatus } from '../utils/agent-utils.js';
import type { AgentUpdateMessage } from '../types/websocket-types.js';
import { listAgents } from '../api/index.js';
import { getValidAccessToken } from '../auth/token-manager.js';

// Server-side maximum page size (see listAgents in the OpenAPI spec)
const AGENTS_PAGE_SIZE = 100;

// Initial widget state
const initialWidgetState: AgentListState = {
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

// Create widget state instance
const widgetState = createState<AgentListState>(initialWidgetState);

/**
 * Set agents list
 */
export function setAgents(agents: Agent[]): void {
  widgetState.setState({ agents });
}

/**
 * Add single agent
 */
export function addAgent(agent: Agent): void {
  const current = widgetState.getState();
  const agents = [...current.agents];
  const existingIndex = agents.findIndex(a => a.id === agent.id);

  if (existingIndex === -1) {
    agents.push(agent);
  } else {
    agents[existingIndex] = agent;
  }

  widgetState.setState({ agents });
}

/**
 * Update single agent
 */
export function updateAgent(update: AgentUpdateMessage): void {
  const current = widgetState.getState();
  const agents = current.agents.map(agent => {
    if (agent.id === update.id) {
      return {
        ...agent,
        ...update,
        updatedAt: new Date(), // Update timestamp on any change
      };
    }
    return agent;
  });
  widgetState.setState({ agents });
}

/**
 * Remove agent
 */
export function removeAgent(agentId: string): void {
  const current = widgetState.getState();
  const agents = current.agents.filter(agent => agent.id !== agentId);
  widgetState.setState({ agents });
}

/**
 * Set filter options
 */
export function setFilter(filter: FilterOptions): void {
  widgetState.setState({ filter });
}

/**
 * Clear filters
 */
export function clearFilters(): void {
  widgetState.setState({ filter: {} });
}

/**
 * Set sort options
 */
export function setSort(sort: SortOptions): void {
  widgetState.setState({ sort });
}

/**
 * Set view mode
 */
export function setViewMode(viewMode: ViewMode): void {
  widgetState.setState({ viewMode });
}

/**
 * Select agent
 */
export function selectAgent(agentId: string | null): void {
  widgetState.setState({ selectedAgent: agentId });
}

/**
 * Get all agents
 */
export function getAgents(): Agent[] {
  return widgetState.getState().agents;
}

/**
 * Filter agents by criteria
 */
export function filterAgents(agents: Agent[], filter: FilterOptions): Agent[] {
  let filtered = [...agents];

  // Apply status filter (derived from lastSeenAt)
  if (filter.status) {
    const statusArray = Array.isArray(filter.status) ? filter.status : [filter.status];
    filtered = filtered.filter(agent => {
      const derivedStatus = deriveAgentStatus(agent.lastSeenAt);
      return statusArray.includes(derivedStatus);
    });
  }

  // Apply sectionId filter
  if (filter.sectionId) {
    filtered = filtered.filter(agent => agent.sectionId === filter.sectionId);
  }

  // Apply agentVersion filter
  if (filter.agentVersion) {
    filtered = filtered.filter(agent => agent.agentVersion === filter.agentVersion);
  }

  // Apply search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(agent => {
      // Search in name
      if (agent.name.toLowerCase().includes(searchLower)) return true;

      // Search in sectionId
      if (agent.sectionId.toLowerCase().includes(searchLower)) return true;

      // Search in agentVersion
      if (agent.agentVersion?.toLowerCase().includes(searchLower)) return true;

      // Search in IP addresses
      if (agent.ipAddresses?.some(ip => ip.ip.includes(searchLower))) return true;

      return false;
    });
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
        // Sort by derived status
        aValue = deriveAgentStatus(a.lastSeenAt);
        bValue = deriveAgentStatus(b.lastSeenAt);
        break;
      case 'lastSeenAt':
        // Sort by timestamp (null values go to end)
        aValue = a.lastSeenAt?.getTime() ?? 0;
        bValue = b.lastSeenAt?.getTime() ?? 0;
        break;
      case 'agentVersion':
        aValue = a.agentVersion ?? '';
        bValue = b.agentVersion ?? '';
        break;
      case 'configVersion':
        aValue = a.configVersion;
        bValue = b.configVersion;
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
  return widgetState.subscribe(callback);
}

/**
 * Get agent by ID
 */
export function getAgentById(agentId: string): Agent | null {
  const agents = widgetState.getState().agents;
  return agents.find((agent: Agent) => agent.id === agentId) || null;
}

/**
 * Get agent count by status
 */
export function getAgentCountByStatus(): Record<string, number> {
  const agents = widgetState.getState().agents;
  const counts: Record<string, number> = {
    online: 0,
    offline: 0,
    unknown: 0,
  };

  agents.forEach((agent: Agent) => {
    const status = deriveAgentStatus(agent.lastSeenAt);
    counts[status] = (counts[status] || 0) + 1;
  });

  return counts;
}

/**
 * Load all agents from the API server (authenticated) and replace the agent list.
 * Fetches every page, so filtering and sorting can stay client-side.
 *
 * @throws Error if the request fails (e.g. 401 or network error)
 */
export async function loadAgents(): Promise<void> {
  const agents: Agent[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const { data, error } = await listAgents({
      query: { page, page_size: AGENTS_PAGE_SIZE },
      auth: async () => (await getValidAccessToken()) ?? undefined,
    });

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to load agents');
    }

    agents.push(...data.agents);
    hasNext = data.pagination.has_next ?? page < data.pagination.total_pages;
    page++;
  }

  setAgents(agents);
}
