/**
 * Tests for agent state management
 */

import type { Agent } from '../../../src/types/agent-types.js';
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
import { deriveAgentStatus } from '../../../src/utils/agent-utils.js';
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
      expect(updated?.agentVersion).toBe(mockAgentUpdate.agentVersion);
      expect(updated?.configVersion).toBe(mockAgentUpdate.configVersion);
    });

    it('does nothing for non-existent agent', () => {
      setAgents([mockAgent]);
      const agentsBefore = getAgents();

      // Create a minimal but complete Agent for update
      const nonExistentAgentUpdate: Agent = {
        ...mockAgent,
        id: 'non-existent',
      };
      updateAgent(nonExistentAgentUpdate);

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
      expect(online.every(a => deriveAgentStatus(a.lastSeenAt) === 'online')).toBe(true);
    });

    it('filters by sectionId', () => {
      const filtered = filterAgents(mockAgents, { sectionId: '01930000-0000-7000-0000-000000000001' });
      expect(filtered.every(a => a.sectionId === '01930000-0000-7000-0000-000000000001')).toBe(true);
    });

    it('filters by agentVersion', () => {
      const filtered = filterAgents(mockAgents, { agentVersion: '1.0.0' });
      expect(filtered.every(a => a.agentVersion === '1.0.0')).toBe(true);
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

    it('sorts by agentVersion', () => {
      const sorted = sortAgents(mockAgents, { field: 'agentVersion', direction: 'asc' });
      const version0 = sorted[0].agentVersion || '';
      const version1 = sorted[1].agentVersion || '';
      expect(version0.localeCompare(version1)).toBeLessThanOrEqual(0);
    });

    it('sorts by lastSeenAt', () => {
      const sorted = sortAgents(mockAgents, { field: 'lastSeenAt', direction: 'desc' });
      const time0 = sorted[0].lastSeenAt?.getTime() ?? 0;
      const time1 = sorted[1].lastSeenAt?.getTime() ?? 0;
      expect(time0).toBeGreaterThanOrEqual(time1);
    });
  });

  describe('getAgentCountByStatus', () => {
    it('returns count of agents by status', () => {
      setAgents(mockAgents);

      const counts = getAgentCountByStatus();
      expect(counts.online).toBeGreaterThan(0);
      expect(counts.offline + counts.unknown).toBeGreaterThan(0);
    });

    it('returns zero for empty state', () => {
      setAgents([]);

      const counts = getAgentCountByStatus();
      expect(counts.online).toBe(0);
      expect(counts.offline).toBe(0);
      expect(counts.unknown).toBe(0);
    });
  });

  describe('loadAgents', () => {
    it('resolves without error', async () => {
      await expect(loadAgents()).resolves.not.toThrow();
    });
  });
});
