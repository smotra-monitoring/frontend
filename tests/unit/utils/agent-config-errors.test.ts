import { describe, it, expect } from 'vitest';
import { describeConfigError, CONFIG_ERROR_MESSAGES } from '../../../src/utils/agent-config-errors.js';

describe('describeConfigError', () => {
    it.each([
        [401, 'unauthorized', CONFIG_ERROR_MESSAGES.unauthorized, false],
        [403, 'forbidden', CONFIG_ERROR_MESSAGES.forbidden, false],
        [404, 'notFound', CONFIG_ERROR_MESSAGES.notFound, false],
        [501, 'notImplemented', CONFIG_ERROR_MESSAGES.notImplemented, false],
        [503, 'unavailable', CONFIG_ERROR_MESSAGES.unavailable, true],
    ] as const)('maps HTTP %i to %s', (status, kind, message, retryable) => {
        expect(describeConfigError(status)).toEqual({ kind, message, status, retryable });
    });

    it('treats a missing response as a retryable network error', () => {
        expect(describeConfigError(undefined)).toEqual({
            kind: 'network',
            message: CONFIG_ERROR_MESSAGES.network,
            retryable: true,
        });
    });

    it('includes the status for unexpected responses', () => {
        expect(describeConfigError(418)).toEqual({
            kind: 'unknown',
            message: 'Unexpected error (HTTP 418).',
            status: 418,
            retryable: true,
        });
    });

    it('uses a different message for every known cause', () => {
        const messages = [401, 403, 404, 501, 503, undefined].map(s => describeConfigError(s).message);
        expect(new Set(messages).size).toBe(messages.length);
    });
});
