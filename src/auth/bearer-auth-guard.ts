/**
 * Auth callback for the generated API client.
 */

import type { Auth } from '../api/client/index.js';
import { getValidAccessToken } from './token-manager.js';

/**
 * Supplies the session token only for HTTP bearer schemes, so operations that also list
 * the agent-only `X-Agent-API-Key` scheme never get the user token in that header.
 */
export async function bearerAuth(auth: Auth): Promise<string | undefined> {
    if (auth.type == 'http' && auth.scheme == 'bearer') {
        return (await getValidAccessToken()) ?? undefined;
    }

    return undefined;
}
