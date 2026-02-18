/**
 * Mock agent data for testing
 */

import type { Agent, AgentStatus } from '../../src/types/dashboard-types.js';

export const mockAgent: Agent = {
  id: 'agent-1',
  name: 'Test Agent 1',
  hostname: 'test-host-1',
  ip: '192.168.1.100',
  ipAddress: '192.168.1.100',
  status: 'online' as AgentStatus,
  version: '1.0.0',
  lastSeen: Date.now(),
  metrics: {
    latency: 25,
    uptime: 86400,
    reachability: 99.5,
    responseTime: 150,
    lastCheck: Date.now(),
  },
  tags: ['production', 'web-server'],
};

export const mockAgents: Agent[] = [
  mockAgent,
  {
    id: 'agent-2',
    name: 'Test Agent 2',
    hostname: 'test-host-2',
    ip: '192.168.1.101',
    ipAddress: '192.168.1.101',
    status: 'offline' as AgentStatus,
    version: '1.0.0',
    lastSeen: Date.now() - 300000, // 5 minutes ago
    metrics: {
      latency: 0,
      uptime: 0,
      reachability: 0,
      responseTime: 0,
      lastCheck: Date.now() - 300000,
    },
    tags: ['staging', 'database'],
  },
  {
    id: 'agent-3',
    name: 'Test Agent 3',
    hostname: 'test-host-3',
    ip: '192.168.1.102',
    ipAddress: '192.168.1.102',
    status: 'warning' as AgentStatus,
    version: '1.0.0',
    lastSeen: Date.now(),
    metrics: {
      latency: 500,
      uptime: 43200,
      reachability: 85,
      responseTime: 750,
      lastCheck: Date.now(),
    },
    tags: ['production', 'cache'],
  },
  {
    id: 'agent-4',
    name: 'Test Agent 4',
    hostname: 'test-host-4',
    ip: '192.168.1.103',
    ipAddress: '192.168.1.103',
    status: 'error' as AgentStatus,
    version: '1.0.0',
    lastSeen: Date.now(),
    metrics: {
      latency: 1000,
      uptime: 1800,
      reachability: 50,
      responseTime: 2000,
      lastCheck: Date.now(),
    },
    tags: ['production', 'api'],
  },
];

export const mockAgentUpdate = {
  id: 'agent-1',
  status: 'online' as AgentStatus,
  metrics: {
    latency: 30,
    reachability: 99.8,
  },
  lastSeen: Date.now(),
};
