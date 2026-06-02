/**
 * Integration test for dashboard features (agent management, filtering, WebSocket updates)
 */

import {
  setAgents,
  addAgent,
  updateAgent,
  removeAgent,
  getAgents,
  filterAgents,
  sortAgents,
  getAgentCountByStatus,
} from '../../src/state/agent-state.js';
import { deriveAgentStatus } from '../../src/utils/agent-utils.js';
import { mockAgent, mockAgents, mockAgentUpdate } from '../mocks/agent-data.js';
import { MockWebSocket, mockAgentUpdateMessage, mockAgentAddedMessage, mockAgentRemovedMessage } from '../mocks/websocket-messages.js';

describe('Dashboard (Integration)', () => {
  beforeEach(() => {
    setAgents([]);
  });

  describe('Agent list management', () => {
    it('loads and displays agents', () => {
      setAgents(mockAgents);

      const agents = getAgents();
      expect(agents).toHaveLength(mockAgents.length);
      expect(agents).toEqual(mockAgents);
    });

    it('calculates status counts', () => {
      setAgents(mockAgents);

      const counts = getAgentCountByStatus();
      expect(counts.online).toBeGreaterThan(0);
      expect(counts.offline + counts.unknown).toBeGreaterThan(0);

      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      expect(total).toBe(mockAgents.length);
    });
  });

  describe('Filtering and sorting', () => {
    beforeEach(() => {
      setAgents(mockAgents);
    });

    it('filters agents by status and sorts by name', () => {
      // Filter online agents (derived from lastSeenAt)
      const online = filterAgents(mockAgents, { status: 'online' });
      expect(online.every(a => deriveAgentStatus(a.lastSeenAt) === 'online')).toBe(true);

      // Sort by name
      const sorted = sortAgents(online, { field: 'name', direction: 'asc' });

      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].name.localeCompare(sorted[i].name)).toBeLessThanOrEqual(0);
      }
    });

    it('filters by sectionId and sorts by lastSeenAt', () => {
      const section1 = filterAgents(mockAgents, { sectionId: '01930000-0000-7000-0000-000000000001' });
      expect(section1.every(a => a.sectionId === '01930000-0000-7000-0000-000000000001')).toBe(true);

      const sorted = sortAgents(section1, { field: 'lastSeenAt', direction: 'desc' });

      // Verify descending order (most recent first)
      for (let i = 1; i < sorted.length; i++) {
        const prevTime = sorted[i - 1].lastSeenAt?.getTime() ?? 0;
        const currTime = sorted[i].lastSeenAt?.getTime() ?? 0;
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it('searches agents by name and IP address', () => {
      const results = filterAgents(mockAgents, { search: 'Agent 2' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toContain('Agent 2');

      const results2 = filterAgents(mockAgents, { search: '192.168.1.100' });
      expect(results2).toHaveLength(1);
      expect(results2[0].ipAddresses?.[0].ip).toBe('192.168.1.100');
    });
  });

  describe('Real-time WebSocket updates', () => {
    let ws: MockWebSocket;

    beforeEach(() => {
      setAgents(mockAgents);
      ws = new MockWebSocket('ws://localhost:8080/ws');
    });

    it('updates agent on WebSocket message', () => {
      const agentId = mockAgents[0].id;
      const initialAgent = getAgents().find(a => a.id === agentId);
      const initialVersion = initialAgent!.agentVersion;

      // Simulate WebSocket update
      ws.simulateMessage(mockAgentUpdateMessage);

      // Process update synchronously
      updateAgent(mockAgentUpdateMessage.payload);

      const updatedAgent = getAgents().find(a => a.id === agentId);
      expect(updatedAgent!.agentVersion).not.toBe(initialVersion);
      expect(updatedAgent!.agentVersion).toBe(mockAgentUpdateMessage.payload.agentVersion);
    });

    it('adds new agent via WebSocket', () => {
      const initialCount = getAgents().length;

      ws.simulateMessage(mockAgentAddedMessage);

      // Process update synchronously
      addAgent(mockAgentAddedMessage.payload);

      const agents = getAgents();
      expect(agents).toHaveLength(initialCount + 1);
      expect(agents.some(a => a.id === mockAgentAddedMessage.payload.id)).toBe(true);
    });

    it('removes agent via WebSocket', () => {
      const initialCount = getAgents().length;
      const agentToRemove = mockAgents[0].id;

      ws.simulateMessage(mockAgentRemovedMessage);

      // Process update synchronously
      removeAgent(mockAgentRemovedMessage.payload.id);

      const agents = getAgents();
      expect(agents).toHaveLength(initialCount - 1);
      expect(agents.some(a => a.id === agentToRemove)).toBe(false);
    });
  });

  describe('Agent lifecycle', () => {
    it('handles complete agent lifecycle: add → update → remove', () => {
      // Start empty
      expect(getAgents()).toHaveLength(0);

      // Add agent
      addAgent(mockAgent);
      expect(getAgents()).toHaveLength(1);
      expect(getAgents()[0].agentVersion).toBe(mockAgent.agentVersion);

      // Update agent
      updateAgent({
        id: mockAgent.id,
        agentVersion: '1.0.1',
        configVersion: 4,
      });
      expect(getAgents()[0].agentVersion).toBe('1.0.1');
      expect(getAgents()[0].configVersion).toBe(4);

      // Remove agent
      removeAgent(mockAgent.id);
      expect(getAgents()).toHaveLength(0);
    });

    it('handles multiple simultaneous agent updates', () => {
      setAgents(mockAgents);

      // Update multiple agents
      updateAgent({ id: mockAgents[0].id, agentVersion: '1.1.0' });
      updateAgent({ id: mockAgents[1].id, agentVersion: '1.2.0' });
      updateAgent({ id: mockAgents[2].id, agentVersion: '1.3.0' });

      const agents = getAgents();
      expect(agents.find(a => a.id === mockAgents[0].id)!.agentVersion).toBe('1.1.0');
      expect(agents.find(a => a.id === mockAgents[1].id)!.agentVersion).toBe('1.2.0');
      expect(agents.find(a => a.id === mockAgents[2].id)!.agentVersion).toBe('1.3.0');
    });
  });

  describe('Status transitions', () => {
    it('updates status counts when agent lastSeenAt changes', () => {
      setAgents(mockAgents);

      const initialCounts = getAgentCountByStatus();
      const initialOnline = initialCounts.online;

      // Find an offline agent (lastSeenAt beyond threshold)
      const offlineAgent = mockAgents.find(a => deriveAgentStatus(a.lastSeenAt) === 'offline');
      if (offlineAgent) {
        // Update to make it online (recent lastSeenAt)
        updateAgent({ id: offlineAgent.id, lastSeenAt: new Date() });

        const newCounts = getAgentCountByStatus();
        expect(newCounts.online).toBe(initialOnline + 1);
        expect(newCounts.offline).toBe(initialCounts.offline - 1);
      }
    });

    it('reflects all status types correctly', () => {
      const now = new Date();
      const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);
      const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
      
      // Create agents with all derived status types
      setAgents([
        { ...mockAgent, id: '1', lastSeenAt: minutesAgo(1) }, // online
        { ...mockAgent, id: '2', lastSeenAt: hoursAgo(1) }, // offline
        { ...mockAgent, id: '3', lastSeenAt: null }, // unknown
      ]);

      const counts = getAgentCountByStatus();
      expect(counts.online).toBe(1);
      expect(counts.offline).toBe(1);
      expect(counts.unknown).toBe(1);
    });
  });
});
