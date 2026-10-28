/**
 * Mock sessions matching the OpenAPI `Session` schema
 */

import type { Session } from '../../src/api/index.js';

export const mockSessions: Session[] = [
    {
        id: '0197f96c-b278-7f64-a32f-dae3cabe1ff0',
        created_at: new Date('2026-05-01T08:00:00Z'),
        last_used_at: new Date('2026-05-02T09:30:00Z'),
        expires_at: new Date('2026-06-01T08:00:00Z'),
        ip_address: '203.0.113.10',
        user_agent: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
        provider: 'google',
        is_current: true,
    },
    {
        id: '0197f96c-b278-7f64-a32f-dae3cabe1ff1',
        created_at: new Date('2026-04-20T12:00:00Z'),
        last_used_at: new Date('2026-04-21T12:00:00Z'),
        expires_at: new Date('2026-05-20T12:00:00Z'),
        ip_address: '198.51.100.7',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        provider: 'okta',
        is_current: false,
    },
    {
        // Optional fields (ip_address, user_agent) absent
        id: '0197f96c-b278-7f64-a32f-dae3cabe1ff2',
        created_at: new Date('2026-03-01T00:00:00Z'),
        last_used_at: new Date('2026-03-02T00:00:00Z'),
        expires_at: new Date('2026-04-01T00:00:00Z'),
        provider: 'azure',
        is_current: false,
    },
];
