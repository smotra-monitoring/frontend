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
      expect(counts.offline).toBeGreaterThan(0);
      expect(counts.warning).toBeGreaterThan(0);

      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      expect(total).toBe(mockAgents.length);
    });
  });

  describe('Filtering and sorting', () => {
    beforeEach(() => {
      setAgents(mockAgents);
    });

    it('filters agents by status and sorts by name', () => {
      // Filter online agents
      const online = filterAgents(mockAgents, { status: 'online' });
      expect(online.every(a => a.status === 'online')).toBe(true);

      // Sort by name
      const sorted = sortAgents(online, { field: 'name', direction: 'asc' });

      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].name.localeCompare(sorted[i].name)).toBeLessThanOrEqual(0);
      }
    });

    it('filters by tag and sorts by latency', () => {
      const production = filterAgents(mockAgents, { tags: ['production'] });
      expect(production.every(a => a.tags.includes('production'))).toBe(true);

      const sorted = sortAgents(production, { field: 'latency', direction: 'asc' });

      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].metrics.latency).toBeLessThanOrEqual(sorted[i].metrics.latency);
      }
    });

    it('searches agents by name and hostname', () => {
      const results = filterAgents(mockAgents, { search: 'Agent 2' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toContain('Agent 2');

      const results2 = filterAgents(mockAgents, { search: 'test-host-1' });
      expect(results2).toHaveLength(1);
      expect(results2[0].hostname).toBe('test-host-1');
    });
  });

  describe('Real-time WebSocket updates', () => {
    let ws: MockWebSocket;

    beforeEach(() => {
      setAgents(mockAgents);
      ws = new MockWebSocket('ws://localhost:8080/ws');
    });

    it('updates agent metrics on WebSocket message', (done) => {
      const agentId = mockAgents[0].id;
      const initialAgent = getAgents().find(a => a.id === agentId);
      const initialLatency = initialAgent!.metrics.latency;

      // Simulate WebSocket update
      ws.simulateMessage(mockAgentUpdateMessage);

      // Process update
      setTimeout(() => {
        updateAgent(mockAgentUpdateMessage.payload);

        const updatedAgent = getAgents().find(a => a.id === agentId);
        expect(updatedAgent!.metrics.latency).not.toBe(initialLatency);
        expect(updatedAgent!.metrics.latency).toBe(mockAgentUpdateMessage.payload.metrics!.latency);

        done();
      }, 20);
    });

    it('adds new agent via WebSocket', (done) => {
      const initialCount = getAgents().length;

      ws.simulateMessage(mockAgentAddedMessage);

      setTimeout(() => {
        addAgent(mockAgentAddedMessage.payload);

        const agents = getAgents();
        expect(agents).toHaveLength(initialCount + 1);
        expect(agents.some(a => a.id === mockAgentAddedMessage.payload.id)).toBe(true);

        done();
      }, 20);
    });

    it('removes agent via WebSocket', (done) => {
      const initialCount = getAgents().length;
      const agentToRemove = mockAgents[0].id;

      ws.simulateMessage(mockAgentRemovedMessage);

      setTimeout(() => {
        removeAgent(mockAgentRemovedMessage.payload.id);

        const agents = getAgents();
        expect(agents).toHaveLength(initialCount - 1);
        expect(agents.some(a => a.id === agentToRemove)).toBe(false);

        done();
      }, 20);
    });
  });

  describe('Agent lifecycle', () => {
    it('handles complete agent lifecycle: add → update → remove', () => {
      // Start empty
      expect(getAgents()).toHaveLength(0);

      // Add agent
      addAgent(mockAgent);
      expect(getAgents()).toHaveLength(1);
      expect(getAgents()[0].metrics.latency).toBe(mockAgent.metrics.latency);

      // Update agent
      updateAgent({
        id: mockAgent.id,
        metrics: { latency: 100 },
      });
      expect(getAgents()[0].metrics.latency).toBe(100);

      // Remove agent
      removeAgent(mockAgent.id);
      expect(getAgents()).toHaveLength(0);
    });

    it('handles multiple simultaneous agent updates', () => {
      setAgents(mockAgents);

      // Update multiple agents
      updateAgent({ id: mockAgents[0].id, metrics: { latency: 10 } });
      updateAgent({ id: mockAgents[1].id, metrics: { latency: 20 } });
      updateAgent({ id: mockAgents[2].id, metrics: { latency: 30 } });

      const agents = getAgents();
      expect(agents.find(a => a.id === mockAgents[0].id)!.metrics.latency).toBe(10);
      expect(agents.find(a => a.id === mockAgents[1].id)!.metrics.latency).toBe(20);
      expect(agents.find(a => a.id === mockAgents[2].id)!.metrics.latency).toBe(30);
    });
  });

  describe('Status transitions', () => {
    it('updates status counts when agent status changes', () => {
      setAgents(mockAgents);

      const initialCounts = getAgentCountByStatus();
      const initialOnline = initialCounts.online;

      // Change an offline agent to online
      const offlineAgent = mockAgents.find(a => a.status === 'offline');
      if (offlineAgent) {
        updateAgent({ id: offlineAgent.id, status: 'online' });

        const newCounts = getAgentCountByStatus();
        expect(newCounts.online).toBe(initialOnline + 1);
        expect(newCounts.offline).toBe(initialCounts.offline - 1);
      }
    });

    it('reflects all status types correctly', () => {
      // Create agents with all status types
      setAgents([
        { ...mockAgent, id: '1', status: 'online' },
        { ...mockAgent, id: '2', status: 'offline' },
        { ...mockAgent, id: '3', status: 'warning' },
        { ...mockAgent, id: '4', status: 'error' },
        { ...mockAgent, id: '5', status: 'unknown' },
      ]);

      const counts = getAgentCountByStatus();
      expect(counts.online).toBe(1);
      expect(counts.offline).toBe(1);
      expect(counts.warning).toBe(1);
    });
  });
});
