import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAgentConfiguration } from '../../../src/api/index.js';
import { getValidAccessToken } from '../../../src/auth/token-manager.js';
import {
    getAgentConfigState,
    loadAgentConfig,
    resetAgentConfig,
    subscribeToAgentConfig,
} from '../../../src/state/agent-config-state.js';
import { mockAgent, mockAgentConfigPatch } from '../../mocks/agent-data.js';

vi.mock('../../../src/api/index.js', () => ({ getAgentConfiguration: vi.fn() }));
vi.mock('../../../src/auth/token-manager.js', () => ({ getValidAccessToken: vi.fn() }));

type ConfigResult = Awaited<ReturnType<typeof getAgentConfiguration>>;

const ok = (data = mockAgentConfigPatch) => ({ data, response: { status: 200 } }) as unknown as ConfigResult;
const failed = (status: number) =>
    ({ error: { message: 'x' }, response: { status } }) as unknown as ConfigResult;

describe('agent-config-state', () => {
    beforeEach(() => {
        resetAgentConfig();
        vi.mocked(getAgentConfiguration).mockReset();
        vi.mocked(getValidAccessToken).mockReset().mockResolvedValue('st_live_token');
    });

    it('starts idle', () => {
        expect(getAgentConfigState()).toEqual({
            agentId: null, status: 'idle', data: null, error: null, fetchedForVersion: null,
        });
    });

    it('loads the patch and records the fetched version', async () => {
        vi.mocked(getAgentConfiguration).mockResolvedValue(ok());

        const pending = loadAgentConfig(mockAgent.id);
        expect(getAgentConfigState()).toMatchObject({ agentId: mockAgent.id, status: 'loading' });

        await pending;
        expect(getAgentConfigState()).toEqual({
            agentId: mockAgent.id,
            status: 'loaded',
            data: mockAgentConfigPatch,
            error: null,
            fetchedForVersion: BigInt(3),
        });
        expect(vi.mocked(getAgentConfiguration).mock.calls[0]?.[0]?.path).toEqual({ agentId: mockAgent.id });
    });

    it('supplies the session token to the request', async () => {
        vi.mocked(getAgentConfiguration).mockResolvedValue(ok());
        await loadAgentConfig(mockAgent.id);

        const auth = vi.mocked(getAgentConfiguration).mock.calls[0]?.[0]?.auth as () => Promise<string | undefined>;
        await expect(auth()).resolves.toBe('st_live_token');
    });

    it.each([
        [401, 'unauthorized'],
        [403, 'forbidden'],
        [404, 'notFound'],
        [501, 'notImplemented'],
        [503, 'unavailable'],
        [500, 'unknown'],
    ])('stores a distinct error for HTTP %i', async (status, kind) => {
        vi.mocked(getAgentConfiguration).mockResolvedValue(failed(status));
        await loadAgentConfig(mockAgent.id);

        const state = getAgentConfigState();
        expect(state.status).toBe('error');
        expect(state.data).toBeNull();
        expect(state.error).toMatchObject({ kind, status });
    });

    it('maps a thrown request to a network error without rejecting', async () => {
        vi.mocked(getAgentConfiguration).mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(loadAgentConfig(mockAgent.id)).resolves.toBeUndefined();

        expect(getAgentConfigState().error).toMatchObject({ kind: 'network', retryable: true });
    });

    it('discards the response of a superseded request', async () => {
        let resolveFirst!: (value: ConfigResult) => void;
        vi.mocked(getAgentConfiguration)
            .mockReturnValueOnce(new Promise<ConfigResult>(resolve => { resolveFirst = resolve; }) as ReturnType<typeof getAgentConfiguration>)
            .mockResolvedValueOnce(ok({ ...mockAgentConfigPatch, id: 'agent-b', config_version_desired: BigInt(7) }));

        const first = loadAgentConfig('agent-a');
        await loadAgentConfig('agent-b');
        resolveFirst(ok());
        await first;

        expect(getAgentConfigState()).toMatchObject({ agentId: 'agent-b', status: 'loaded', fetchedForVersion: BigInt(7) });
    });

    it('ignores a response that arrives after reset', async () => {
        let resolve!: (value: ConfigResult) => void;
        vi.mocked(getAgentConfiguration).mockReturnValueOnce(
            new Promise<ConfigResult>(r => { resolve = r; }) as ReturnType<typeof getAgentConfiguration>
        );

        const pending = loadAgentConfig(mockAgent.id);
        resetAgentConfig();
        resolve(ok());
        await pending;

        expect(getAgentConfigState().status).toBe('idle');
    });

    it('notifies subscribers and stops after unsubscribe', async () => {
        vi.mocked(getAgentConfiguration).mockResolvedValue(ok());
        const statuses: string[] = [];
        const unsubscribe = subscribeToAgentConfig(s => statuses.push(s.status));

        await loadAgentConfig(mockAgent.id);
        unsubscribe();
        resetAgentConfig();

        expect(statuses).toEqual(['loading', 'loaded']);
    });
});
