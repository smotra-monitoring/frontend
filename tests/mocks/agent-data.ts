/**
 * Mock agent data for testing
 */

import type { Agent } from '../../src/types/agent-types.js';
import type { AgentUpdateMessage } from '../../src/types/websocket-types.js';

const now = new Date();
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

export const mockAgent: Agent = {
  id: '01930000-0000-7000-a001-000000000001',
  workspace_id: '01930000-0000-7000-0000-000000000001',
  name: 'Test Agent 1',
  config_version_desired: 3,
  config_version_current: 3,
  agent_version: '1.0.0',
  ip_addresses: [
    { ip: '192.168.1.100', iface: 'eth0', family: 'ipv4', recommended: true },
  ],
  last_seen_at: minutesAgo(1), // online
  last_result_submitted_at: minutesAgo(2),
  created_at: daysAgo(10),
  updated_at: minutesAgo(1),
};

export const mockAgents: Agent[] = [
  mockAgent,
  {
    id: '01930000-0000-7000-a002-000000000002',
    workspace_id: '01930000-0000-7000-0000-000000000001',
    name: 'Test Agent 2',
    config_version_desired: 2,
    config_version_current: 1, // behind desired: config not yet applied
    agent_version: '1.0.0',
    ip_addresses: [
      { ip: '192.168.1.101', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    last_seen_at: hoursAgo(1), // offline (beyond 5 min threshold)
    last_result_submitted_at: hoursAgo(1),
    created_at: daysAgo(9),
    updated_at: hoursAgo(1),
  },
  {
    id: '01930000-0000-7000-a003-000000000003',
    workspace_id: '01930000-0000-7000-0000-000000000002',
    name: 'Test Agent 3',
    config_version_desired: 1,
    config_version_current: 1,
    agent_version: '1.0.1',
    ip_addresses: [
      { ip: '192.168.1.102', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    last_seen_at: minutesAgo(2), // online
    last_result_submitted_at: minutesAgo(3),
    created_at: daysAgo(8),
    updated_at: minutesAgo(2),
  },
  {
    id: '01930000-0000-7000-a004-000000000004',
    workspace_id: '01930000-0000-7000-0000-000000000001',
    name: 'Test Agent 4',
    config_version_desired: 4,
    config_version_current: null, // never reported
    agent_version: '1.0.0',
    ip_addresses: [
      { ip: '192.168.1.103', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    last_seen_at: null, // unknown (never seen)
    last_result_submitted_at: null,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
  },
];

export const mockAgentUpdate: Agent = {
  id: '01930000-0000-7000-a001-000000000001',
  workspace_id: '01930000-0000-7000-0000-000000000001',
  name: 'Test Agent 1',
  config_version_desired: 4,
  config_version_current: 4,
  agent_version: '1.0.1',
  ip_addresses: [
    { ip: '192.168.1.100', iface: 'eth0', family: 'ipv4', recommended: true },
  ],
  last_seen_at: now,
  last_result_submitted_at: minutesAgo(2),
  created_at: daysAgo(10),
  updated_at: now,
};
