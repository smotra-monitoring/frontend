/**
 * Tests for agent state management
 */

import {
  setAgents,
  addAgent,
  updateAgent,
  removeAgent,
  getAgents,
  getAgentById,
  filterAgents,
  sortAgents,
  getAgentCountByStatus,
  loadAgents,
  subscribeToAgents,
} from '../../../src/state/agent-state.js';
import { mockAgent, mockAgents, mockAgentUpdate } from '../../mocks/agent-data.js';

describe('agent-state', () => {
  beforeEach(() => {
    // Reset state by setting empty agents list
    setAgents([]);
  });

  describe('setAgents', () => {
    it('replaces agents list', () => {
      setAgents(mockAgents);
      expect(getAgents()).toEqual(mockAgents);
    });

    it('notifies subscribers', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToAgents(callback);

      setAgents(mockAgents);
      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('addAgent', () => {
    it('adds agent to list', () => {
      setAgents([]);
      addAgent(mockAgent);

      const agents = getAgents();
      expect(agents).toHaveLength(1);
      expect(agents[0]).toEqual(mockAgent);
    });

    it('does not add duplicate agents', () => {
      setAgents([mockAgent]);
      addAgent(mockAgent); // Same ID

      expect(getAgents()).toHaveLength(1);
    });
  });

  describe('updateAgent', () => {
    it('updates existing agent', () => {
      setAgents([mockAgent]);

      updateAgent(mockAgentUpdate);

      const updated = getAgentById(mockAgent.id);
      expect(updated?.metrics.latency).toBe(mockAgentUpdate.metrics.latency);
    });

    it('does nothing for non-existent agent', () => {
      setAgents([mockAgent]);
      const agentsBefore = getAgents();

      updateAgent({ id: 'non-existent', metrics: {} });

      expect(getAgents()).toEqual(agentsBefore);
    });
  });

  describe('removeAgent', () => {
    it('removes agent from list', () => {
      setAgents(mockAgents);

      removeAgent(mockAgents[0].id);

      const agents = getAgents();
      expect(agents).toHaveLength(mockAgents.length - 1);
      expect(agents.find(a => a.id === mockAgents[0].id)).toBeUndefined();
    });

    it('does nothing for non-existent agent', () => {
      setAgents(mockAgents);
      const initialLength = getAgents().length;

      removeAgent('non-existent');

      expect(getAgents()).toHaveLength(initialLength);
    });
  });

  describe('getAgentById', () => {
    it('returns agent by ID', () => {
      setAgents(mockAgents);

      const agent = getAgentById(mockAgents[0].id);
      expect(agent).toEqual(mockAgents[0]);
    });

    it('returns null for non-existent ID', () => {
      setAgents(mockAgents);
      expect(getAgentById('non-existent')).toBeNull();
    });
  });

  describe('filterAgents', () => {
    it('filters by status', () => {
      const online = filterAgents(mockAgents, { status: 'online' });
      expect(online.every(a => a.status === 'online')).toBe(true);
    });

    it('filters by hostname', () => {
      const filtered = filterAgents(mockAgents, { hostname: 'test-host-1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].hostname).toBe('test-host-1');
    });

    it('filters by tag', () => {
      const production = filterAgents(mockAgents, { tags: ['production'] });
      expect(production.every(a => a.tags.includes('production'))).toBe(true);
    });

    it('filters by search term', () => {
      const results = filterAgents(mockAgents, { search: 'Agent 2' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toContain('Agent 2');
    });

    it('returns all agents with empty filter', () => {
      const all = filterAgents(mockAgents, {});
      expect(all).toHaveLength(mockAgents.length);
    });
  });

  describe('sortAgents', () => {
    it('sorts by name ascending', () => {
      const sorted = sortAgents(mockAgents, { field: 'name', direction: 'asc' });
      expect(sorted[0].name.localeCompare(sorted[1].name)).toBeLessThan(0);
    });

    it('sorts by name descending', () => {
      const sorted = sortAgents(mockAgents, { field: 'name', direction: 'desc' });
      expect(sorted[0].name.localeCompare(sorted[1].name)).toBeGreaterThan(0);
    });

    it('sorts by latency', () => {
      const sorted = sortAgents(mockAgents, { field: 'latency', direction: 'asc' });
      expect(sorted[0].metrics.latency).toBeLessThanOrEqual(sorted[1].metrics.latency);
    });

    it('sorts by lastSeen', () => {
      const sorted = sortAgents(mockAgents, { field: 'lastSeen', direction: 'desc' });
      expect(sorted[0].lastSeen).toBeGreaterThanOrEqual(sorted[1].lastSeen);
    });
  });

  describe('getAgentCountByStatus', () => {
    it('returns count of agents by status', () => {
      setAgents(mockAgents);

      const counts = getAgentCountByStatus();
      expect(counts.online).toBeGreaterThan(0);
      expect(counts.offline).toBeGreaterThan(0);
      expect(counts.warning).toBeGreaterThan(0);
    });

    it('returns zero for empty state', () => {
      setAgents([]);

      const counts = getAgentCountByStatus();
      expect(counts.online).toBe(0);
      expect(counts.offline).toBe(0);
    });
  });

  describe('loadAgents', () => {
    it('resolves without error', async () => {
      await expect(loadAgents()).resolves.not.toThrow();
    });
  });
});
