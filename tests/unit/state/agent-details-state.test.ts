import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAgent } from '../../../src/api/index.js';
import { getValidAccessToken } from '../../../src/auth/token-manager.js';
import {
    getAgentDetailsState,
    loadAgentDetails,
    resetAgentDetails,
    subscribeToAgentDetails,
} from '../../../src/state/agent-details-state.js';
import { mockAgent } from '../../mocks/agent-data.js';

vi.mock('../../../src/api/index.js', () => ({ getAgent: vi.fn() }));
vi.mock('../../../src/auth/token-manager.js', () => ({ getValidAccessToken: vi.fn() }));

type AgentResult = Awaited<ReturnType<typeof getAgent>>;

const ok = (data = mockAgent) => ({ data, response: { status: 200 } }) as unknown as AgentResult;
const failed = (status: number, message: string) =>
    ({ error: { error: 'x', message }, response: { status } }) as unknown as AgentResult;

describe('agent-details-state', () => {
    beforeEach(() => {
        resetAgentDetails();
        vi.mocked(getAgent).mockReset();
        vi.mocked(getValidAccessToken).mockReset().mockResolvedValue('st_live_token');
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('starts idle', () => {
        expect(getAgentDetailsState()).toEqual({ agentId: null, status: 'idle', data: null, error: null });
    });

    it('loads the agent', async () => {
        vi.mocked(getAgent).mockResolvedValue(ok());

        const pending = loadAgentDetails(mockAgent.id);
        expect(getAgentDetailsState()).toMatchObject({ agentId: mockAgent.id, status: 'loading', data: null });

        await pending;
        expect(getAgentDetailsState()).toEqual({ agentId: mockAgent.id, status: 'loaded', data: mockAgent, error: null });
        expect(vi.mocked(getAgent).mock.calls[0]?.[0]?.path).toEqual({ agentId: mockAgent.id });
    });

    it('supplies the session token to the request', async () => {
        vi.mocked(getAgent).mockResolvedValue(ok());
        await loadAgentDetails(mockAgent.id);

        const auth = vi.mocked(getAgent).mock.calls[0]?.[0]?.auth as () => Promise<string | undefined>;
        await expect(auth()).resolves.toBe('st_live_token');
    });

    it.each([401, 404, 500])('stores the server message for HTTP %i', async (status) => {
        vi.mocked(getAgent).mockResolvedValue(failed(status, `server says ${status}`));
        await loadAgentDetails(mockAgent.id);

        const state = getAgentDetailsState();
        expect(state.status).toBe('error');
        expect(state.data).toBeNull();
        expect(state.error).toEqual({ message: `server says ${status}`, status });
    });

    it('falls back to a generic message when the server sent no error body', async () => {
        vi.mocked(getAgent).mockResolvedValue(
            { error: undefined, data: undefined, response: { status: 502 } } as unknown as AgentResult
        );
        await loadAgentDetails(mockAgent.id);

        expect(getAgentDetailsState().error).toEqual({ message: 'Failed to load agent details', status: 502 });
    });

    it('stores the thrown error message without rejecting', async () => {
        vi.mocked(getAgent).mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(loadAgentDetails(mockAgent.id)).resolves.toBeUndefined();

        expect(getAgentDetailsState().error).toEqual({ message: 'Failed to fetch' });
    });

    it('discards the response of a superseded request', async () => {
        let resolveFirst!: (value: AgentResult) => void;
        vi.mocked(getAgent)
            .mockReturnValueOnce(new Promise<AgentResult>(resolve => { resolveFirst = resolve; }) as ReturnType<typeof getAgent>)
            .mockResolvedValueOnce(ok({ ...mockAgent, id: 'agent-b', name: 'B' }));

        const first = loadAgentDetails('agent-a');
        await loadAgentDetails('agent-b');
        resolveFirst(ok());
        await first;

        expect(getAgentDetailsState()).toMatchObject({ agentId: 'agent-b', status: 'loaded' });
        expect(getAgentDetailsState().data?.name).toBe('B');
    });

    it('ignores a response that arrives after reset', async () => {
        let resolve!: (value: AgentResult) => void;
        vi.mocked(getAgent).mockReturnValueOnce(
            new Promise<AgentResult>(r => { resolve = r; }) as ReturnType<typeof getAgent>
        );

        const pending = loadAgentDetails(mockAgent.id);
        resetAgentDetails();
        resolve(ok());
        await pending;

        expect(getAgentDetailsState().status).toBe('idle');
    });

    it('notifies subscribers and stops after unsubscribe', async () => {
        vi.mocked(getAgent).mockResolvedValue(ok());
        const statuses: string[] = [];
        const unsubscribe = subscribeToAgentDetails(s => statuses.push(s.status));

        await loadAgentDetails(mockAgent.id);
        unsubscribe();
        resetAgentDetails();

        expect(statuses).toEqual(['loading', 'loaded']);
    });
});
