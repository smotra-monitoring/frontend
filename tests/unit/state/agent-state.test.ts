/**
 * Tests for agent state management
 */

import { vi } from 'vitest';
import type { Agent } from '../../../src/types/agent-types.js';
import { listAgents } from '../../../src/api/index.js';
import { getValidAccessToken } from '../../../src/auth/token-manager.js';
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

vi.mock('../../../src/api/index.js', () => ({ listAgents: vi.fn() }));
vi.mock('../../../src/auth/token-manager.js', () => ({ getValidAccessToken: vi.fn() }));

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

    it('filters by workspaceId', () => {
      const filtered = filterAgents(mockAgents, { workspaceId: '01930000-0000-7000-0000-000000000001' });
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(a => a.workspaceId === '01930000-0000-7000-0000-000000000001')).toBe(true);
    });

    it('excludes agents from other workspaces', () => {
      const filtered = filterAgents(mockAgents, { workspaceId: '01930000-0000-7000-0000-000000000002' });
      expect(filtered.map(a => a.id)).toEqual(['01930000-0000-7000-a003-000000000003']);
    });

    it('matches search text against workspaceId', () => {
      const filtered = filterAgents(mockAgents, { search: '000000000002' });
      expect(filtered.map(a => a.id)).toContain('01930000-0000-7000-a003-000000000003');
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
    const pagination = (page: number, totalPages: number) => ({
      page,
      page_size: 100,
      total_items: mockAgents.length,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_previous: page > 1,
    });

    beforeEach(() => {
      vi.mocked(listAgents).mockReset();
      vi.mocked(getValidAccessToken).mockReset().mockResolvedValue('st_live_token');
    });

    it('stores agents returned by the API', async () => {
      vi.mocked(listAgents).mockResolvedValue({
        data: { agents: mockAgents, pagination: pagination(1, 1) },
      } as never);

      await loadAgents();

      expect(getAgents()).toEqual(mockAgents);
    });

    it('requests the first page with the maximum page size', async () => {
      vi.mocked(listAgents).mockResolvedValue({
        data: { agents: [], pagination: pagination(1, 1) },
      } as never);

      await loadAgents();

      expect(listAgents).toHaveBeenCalledTimes(1);
      expect(vi.mocked(listAgents).mock.calls[0]?.[0]?.query).toEqual({ page: 1, page_size: 100 });
    });

    it('supplies the session token via the auth callback', async () => {
      vi.mocked(listAgents).mockResolvedValue({
        data: { agents: [], pagination: pagination(1, 1) },
      } as never);

      await loadAgents();

      const auth = vi.mocked(listAgents).mock.calls[0]?.[0]?.auth as () => Promise<string | undefined>;
      await expect(auth()).resolves.toBe('st_live_token');
    });

    it('passes undefined to the auth callback when no valid token exists', async () => {
      vi.mocked(getValidAccessToken).mockResolvedValue(null);
      vi.mocked(listAgents).mockResolvedValue({
        data: { agents: [], pagination: pagination(1, 1) },
      } as never);

      await loadAgents();

      const auth = vi.mocked(listAgents).mock.calls[0]?.[0]?.auth as () => Promise<string | undefined>;
      await expect(auth()).resolves.toBeUndefined();
    });

    it('fetches all pages and combines the agents', async () => {
      vi.mocked(listAgents)
        .mockResolvedValueOnce({
          data: { agents: [mockAgents[0]], pagination: pagination(1, 2) },
        } as never)
        .mockResolvedValueOnce({
          data: { agents: [mockAgents[1]], pagination: pagination(2, 2) },
        } as never);

      await loadAgents();

      expect(listAgents).toHaveBeenCalledTimes(2);
      expect(vi.mocked(listAgents).mock.calls[1]?.[0]?.query).toEqual({ page: 2, page_size: 100 });
      expect(getAgents()).toEqual([mockAgents[0], mockAgents[1]]);
    });

    it('throws the API error message and keeps existing agents on failure', async () => {
      setAgents([mockAgent]);
      vi.mocked(listAgents).mockResolvedValue({
        error: { error: 'unauthorized', message: 'Invalid or missing authentication' },
      } as never);

      await expect(loadAgents()).rejects.toThrow('Invalid or missing authentication');
      expect(getAgents()).toEqual([mockAgent]);
    });

    it('throws a default message when the response has no data', async () => {
      vi.mocked(listAgents).mockResolvedValue({} as never);

      await expect(loadAgents()).rejects.toThrow('Failed to load agents');
    });

    it('propagates network errors', async () => {
      vi.mocked(listAgents).mockRejectedValue(new Error('Network down'));

      await expect(loadAgents()).rejects.toThrow('Network down');
    });
  });
});
