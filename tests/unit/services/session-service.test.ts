import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/api/index.js', () => ({
    listSessions: vi.fn(),
    purgeSession: vi.fn(),
    purgeSessions: vi.fn(),
}));

vi.mock('../../../src/auth/token-manager.js', () => ({
    getValidAccessToken: vi.fn().mockResolvedValue('token-123'),
}));

import { listSessions, purgeSession, purgeSessions } from '../../../src/api/index.js';
import {
    fetchSessions,
    terminateSession,
    terminateOtherSessions,
    SessionServiceError,
} from '../../../src/services/session-service.js';
import { mockSessions } from '../../mocks/session-data.js';
import { getValidAccessToken } from '../../../src/auth/token-manager.js';

describe('session-service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchSessions', () => {
        it('returns sessions and supplies the access token', async () => {
            vi.mocked(listSessions).mockResolvedValue({ data: { sessions: mockSessions } } as never);

            await expect(fetchSessions()).resolves.toEqual(mockSessions);

            const { auth } = vi.mocked(listSessions).mock.calls[0]![0] as { auth: () => Promise<string | undefined> };

            // listSessions is mocked, so expected number of calls to getValidAccessToken is 0
            expect(getValidAccessToken).toHaveBeenCalledTimes(0);
            await expect(auth()).resolves.toBe('token-123');
            expect(getValidAccessToken).toHaveBeenCalledTimes(1);
        });

        it('throws a SessionServiceError with the server message and status', async () => {
            vi.mocked(listSessions).mockResolvedValue({
                error: { message: 'boom' },
                response: { status: 500 },
            } as never);

            await expect(fetchSessions()).rejects.toMatchObject({
                name: 'SessionServiceError',
                message: 'boom',
                status: 500,
            });
        });

        it('falls back to a default message', async () => {
            vi.mocked(listSessions).mockResolvedValue({} as never);
            await expect(fetchSessions()).rejects.toThrow('Failed to load sessions');
        });
    });

    describe('terminateSession', () => {
        it('calls purgeSession with the session id', async () => {
            vi.mocked(purgeSession).mockResolvedValue({ data: undefined } as never);

            await terminateSession('abc');

            expect(purgeSession).toHaveBeenCalledWith(expect.objectContaining({ path: { session_id: 'abc' } }));
        });

        it('throws with the HTTP status on failure', async () => {
            vi.mocked(purgeSession).mockResolvedValue({
                error: { message: 'not found' },
                response: { status: 404 },
            } as never);

            const error = await terminateSession('abc').catch((e: unknown) => e);
            expect(error).toBeInstanceOf(SessionServiceError);
            expect((error as SessionServiceError).status).toBe(404);
        });
    });

    describe('terminateOtherSessions', () => {
        it('returns the number of revoked sessions', async () => {
            vi.mocked(purgeSessions).mockResolvedValue({ data: { revoked_count: 2 } } as never);
            await expect(terminateOtherSessions()).resolves.toBe(2);
        });

        it('throws on error', async () => {
            vi.mocked(purgeSessions).mockResolvedValue({ error: { message: 'nope' }, response: { status: 500 } } as never);
            await expect(terminateOtherSessions()).rejects.toThrow('nope');
        });
    });
});
