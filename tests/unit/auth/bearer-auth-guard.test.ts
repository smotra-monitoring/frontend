import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bearerAuth } from '../../../src/auth/bearer-auth-guard.js';
import { getValidAccessToken } from '../../../src/auth/token-manager.js';

vi.mock('../../../src/auth/token-manager.js', () => ({ getValidAccessToken: vi.fn() }));

describe('bearerAuth', () => {
    beforeEach(() => {
        vi.mocked(getValidAccessToken).mockReset().mockResolvedValue('st_live_token');
    });

    it('returns the session token for the http bearer scheme', async () => {
        await expect(bearerAuth({ type: 'http', scheme: 'bearer' })).resolves.toBe('st_live_token');
    });

    it('returns undefined when the token is unavailable', async () => {
        vi.mocked(getValidAccessToken).mockResolvedValue(null);
        await expect(bearerAuth({ type: 'http', scheme: 'bearer' })).resolves.toBeUndefined();
    });

    it('never supplies the token for the X-Agent-API-Key scheme', async () => {
        await expect(bearerAuth({ name: 'X-Agent-API-Key', type: 'apiKey' })).resolves.toBeUndefined();
        expect(getValidAccessToken).not.toHaveBeenCalled();
    });
});
