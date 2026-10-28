/**
 * Session service
 * Lists and terminates the authenticated user's active sessions via the generated API client.
 */

import { listSessions, purgeSession, purgeSessions } from '../api/index.js';
import type { Session } from '../api/index.js';
import { getValidAccessToken } from '../auth/token-manager.js';

const auth = async () => (await getValidAccessToken()) ?? undefined;

/** Error carrying the HTTP status so callers can special-case e.g. 404. */
export class SessionServiceError extends Error {
    readonly status: number | undefined;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'SessionServiceError';
        this.status = status;
    }
}

/**
 * Fetch all active sessions of the current user, most recently used first.
 *
 * @throws SessionServiceError if the request fails
 */
export async function fetchSessions(): Promise<Session[]> {
    const { data, error, response } = await listSessions({ auth });

    if (error || !data) {
        throw new SessionServiceError(error?.message ?? 'Failed to load sessions', response?.status);
    }

    return data.sessions;
}

/**
 * Terminate (revoke) a single session.
 *
 * @throws SessionServiceError if the request fails
 */
export async function terminateSession(sessionId: string): Promise<void> {
    const { error, response } = await purgeSession({ path: { session_id: sessionId }, auth });

    if (error) {
        throw new SessionServiceError(error.message ?? 'Failed to terminate session', response?.status);
    }
}

/**
 * Terminate every active session except the one making the request.
 *
 * @returns Number of sessions revoked
 * @throws SessionServiceError if the request fails
 */
export async function terminateOtherSessions(): Promise<number> {
    const { data, error, response } = await purgeSessions({ auth });

    if (error || !data) {
        throw new SessionServiceError(error?.message ?? 'Failed to terminate sessions', response?.status);
    }

    return data.revoked_count;
}
