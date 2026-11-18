/**
 * Maps agent configuration request failures to distinct, user-facing errors
 */

import type { AgentConfigError } from '../types/agent-config-types.js';

export const CONFIG_ERROR_MESSAGES = {
  unauthorized: 'Your session has expired. Sign in again.',
  forbidden: "You don't have permission to view this agent's configuration.",
  notFound: 'No configuration found. The agent may have been deleted.',
  notImplemented: "This server version doesn't support configuration retrieval.",
  unavailable: 'The configuration service is temporarily unavailable.',
  network: "Can't reach the server. Check your connection.",
} as const;

/**
 * @param status HTTP status of the response, or undefined when no response was received
 */
export function describeConfigError(status: number | undefined): AgentConfigError {
  switch (status) {
    case undefined:
      return { kind: 'network', message: CONFIG_ERROR_MESSAGES.network, retryable: true };
    case 401:
      return { kind: 'unauthorized', message: CONFIG_ERROR_MESSAGES.unauthorized, status, retryable: false };
    case 403:
      return { kind: 'forbidden', message: CONFIG_ERROR_MESSAGES.forbidden, status, retryable: false };
    case 404:
      return { kind: 'notFound', message: CONFIG_ERROR_MESSAGES.notFound, status, retryable: false };
    case 501:
      return { kind: 'notImplemented', message: CONFIG_ERROR_MESSAGES.notImplemented, status, retryable: false };
    case 503:
      return { kind: 'unavailable', message: CONFIG_ERROR_MESSAGES.unavailable, status, retryable: true };
    default:
      return { kind: 'unknown', message: `Unexpected error (HTTP ${status}).`, status, retryable: true };
  }
}
