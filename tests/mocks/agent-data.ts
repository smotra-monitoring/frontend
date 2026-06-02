/**
 * Mock agent data for testing
 */

import type { Agent } from '../../src/types/dashboard-types.js';

const now = new Date();
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

export const mockAgent: Agent = {
  id: '01930000-0000-7000-a001-000000000001',
  sectionId: '01930000-0000-7000-0000-000000000001',
  name: 'Test Agent 1',
  configVersion: 3,
  agentVersion: '1.0.0',
  ipAddresses: [
    { ip: '192.168.1.100', iface: 'eth0', family: 'ipv4', recommended: true },
  ],
  lastSeenAt: minutesAgo(1), // online
  lastResultSubmittedAt: minutesAgo(2),
  createdAt: daysAgo(10),
  updatedAt: minutesAgo(1),
};

export const mockAgents: Agent[] = [
  mockAgent,
  {
    id: '01930000-0000-7000-a002-000000000002',
    sectionId: '01930000-0000-7000-0000-000000000001',
    name: 'Test Agent 2',
    configVersion: 2,
    agentVersion: '1.0.0',
    ipAddresses: [
      { ip: '192.168.1.101', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: hoursAgo(1), // offline (beyond 5 min threshold)
    lastResultSubmittedAt: hoursAgo(1),
    createdAt: daysAgo(9),
    updatedAt: hoursAgo(1),
  },
  {
    id: '01930000-0000-7000-a003-000000000003',
    sectionId: '01930000-0000-7000-0000-000000000002',
    name: 'Test Agent 3',
    configVersion: 1,
    agentVersion: '1.0.1',
    ipAddresses: [
      { ip: '192.168.1.102', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: minutesAgo(2), // online
    lastResultSubmittedAt: minutesAgo(3),
    createdAt: daysAgo(8),
    updatedAt: minutesAgo(2),
  },
  {
    id: '01930000-0000-7000-a004-000000000004',
    sectionId: '01930000-0000-7000-0000-000000000001',
    name: 'Test Agent 4',
    configVersion: 4,
    agentVersion: '1.0.0',
    ipAddresses: [
      { ip: '192.168.1.103', iface: 'eth0', family: 'ipv4', recommended: true },
    ],
    lastSeenAt: null, // unknown (never seen)
    lastResultSubmittedAt: null,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];

export const mockAgentUpdate = {
  id: '01930000-0000-7000-a001-000000000001',
  lastSeenAt: now,
  agentVersion: '1.0.1',
  configVersion: 4,
};
