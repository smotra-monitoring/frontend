/**
 * Agent monitoring data state management
 */

import { createState, type Subscriber, type UnsubscribeFn } from './global-state.js';
import type { Agent, AgentListState, FilterOptions, SortOptions, AgentUpdate, ViewMode } from '../types/dashboard-types.js';
import { deriveAgentStatus } from '../utils/agent-utils.js';

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
const widgetState = createState<AgentListState>(initialDashboardState);

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
export function updateAgent(update: AgentUpdate): void {
  const current = widgetState.getState();
  const agents = current.agents.map(agent => {
    if (agent.id === update.id) {
      return {
        ...agent,
        ...(update.lastSeenAt !== undefined && { lastSeenAt: update.lastSeenAt }),
        ...(update.agentVersion !== undefined && { agentVersion: update.agentVersion }),
        ...(update.configVersion !== undefined && { configVersion: update.configVersion }),
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
 * Get all agents (legacy - use getAgents)
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

  // Apply tags filter (not in AgentListItem, but kept for future extension)
  if (filter.tags && filter.tags.length > 0) {
    // Tags not in AgentListItem schema, skip for now
    // Can be added later if needed
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

const now = new Date();
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

const fakeAgents: Agent[] = [
  {
    id: '01930000-0000-7000-a001-000000000001',
    sectionId: '01930000-0000-7000-0000-000000000001',
    name: 'web-prod-01',
    configVersion: 3,
    agentVersion: '1.4.2',
    ipAddresses: [
      { ip: '10.0.1.10', iface: 'eth0', family: 'ipv4', recommended: true },
      { ip: '2001:db8::1', iface: 'eth0', family: 'ipv6', recommended: false },
    ],
    lastSeenAt: minutesAgo(1), // online
    lastResultSubmittedAt: minutesAgo(2),
    createdAt: daysAgo(30),
    updatedAt: minutesAgo(1),
  },
  {
    id: '01930000-0000-7000-a002-000000000002',
    sectionId: '01930000-0000-7000-0000-000000000001',
    name: 'web-prod-02',
    configVersion: 3,
    agentVersion: '1.4.2',
    ipAddresses: [
      { ip: '10.0.1.11', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: minutesAgo(2), // online
    lastResultSubmittedAt: minutesAgo(3),
    createdAt: daysAgo(29),
    updatedAt: minutesAgo(2),
  },
  {
    id: '01930000-0000-7000-a003-000000000003',
    sectionId: '01930000-0000-7000-0000-000000000001',
    name: 'api-prod-01',
    configVersion: 5,
    agentVersion: '1.4.2',
    ipAddresses: [
      { ip: '10.0.2.10', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: minutesAgo(0.5), // online (30 seconds ago)
    lastResultSubmittedAt: minutesAgo(1),
    createdAt: daysAgo(20),
    updatedAt: minutesAgo(0.5),
  },
  {
    id: '01930000-0000-7000-a004-000000000004',
    sectionId: '01930000-0000-7000-0000-000000000001',
    name: 'db-primary',
    configVersion: 2,
    agentVersion: '1.3.9',
    ipAddresses: [
      { ip: '10.0.3.10', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: minutesAgo(3), // online
    lastResultSubmittedAt: minutesAgo(4),
    createdAt: daysAgo(60),
    updatedAt: minutesAgo(3),
  },
  {
    id: '01930000-0000-7000-a005-000000000005',
    sectionId: '01930000-0000-7000-0000-000000000001',
    name: 'db-replica-01',
    configVersion: 2,
    agentVersion: '1.4.0',
    ipAddresses: [
      { ip: '10.0.3.11', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: minutesAgo(4), // online
    lastResultSubmittedAt: minutesAgo(5),
    createdAt: daysAgo(50),
    updatedAt: minutesAgo(4),
  },
  {
    id: '01930000-0000-7000-a006-000000000006',
    sectionId: '01930000-0000-7000-0000-000000000001',
    name: 'cache-01',
    configVersion: 4,
    agentVersion: '1.4.2',
    ipAddresses: [
      { ip: '10.0.4.10', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: minutesAgo(1), // online
    lastResultSubmittedAt: minutesAgo(2),
    createdAt: daysAgo(10),
    updatedAt: minutesAgo(1),
  },
  {
    id: '01930000-0000-7000-a007-000000000007',
    sectionId: '01930000-0000-7000-0000-000000000002',
    name: 'worker-staging-01',
    configVersion: 1,
    agentVersion: '1.5.0-beta',
    ipAddresses: [
      { ip: '10.1.1.10', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: hoursAgo(2), // offline (2 hours ago)
    lastResultSubmittedAt: hoursAgo(2),
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(2),
  },
  {
    id: '01930000-0000-7000-a008-000000000008',
    sectionId: '01930000-0000-7000-0000-000000000003',
    name: 'monitor-eu-01',
    configVersion: 3,
    agentVersion: '1.4.1',
    ipAddresses: [
      { ip: '185.12.44.100', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: minutesAgo(1), // online
    lastResultSubmittedAt: minutesAgo(2),
    createdAt: daysAgo(40),
    updatedAt: minutesAgo(1),
  },
  {
    id: '01930000-0000-7000-a009-000000000009',
    sectionId: '01930000-0000-7000-0000-000000000003',
    name: 'monitor-us-01',
    configVersion: 3,
    agentVersion: '1.4.1',
    ipAddresses: [
      { ip: '54.210.33.77', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: minutesAgo(2), // online
    lastResultSubmittedAt: minutesAgo(3),
    createdAt: daysAgo(40),
    updatedAt: minutesAgo(2),
  },
  {
    id: '01930000-0000-7000-a010-000000000010',
    sectionId: '01930000-0000-7000-0000-000000000004',
    name: 'edge-cdn-01',
    configVersion: 2,
    agentVersion: '1.4.0',
    ipAddresses: [
      { ip: '104.21.55.200', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: minutesAgo(15), // offline (15 minutes ago, beyond 5 min threshold)
    lastResultSubmittedAt: minutesAgo(20),
    createdAt: daysAgo(15),
    updatedAt: minutesAgo(15),
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
