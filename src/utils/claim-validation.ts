/**
 * Validation for the agent claim form
 * Each validator returns an error message, or null when the value is valid.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLAIM_CODE_PATTERN = /^[A-Za-z0-9]+$/;

export const CLAIM_CODE_MIN_LENGTH = 4;
export const CLAIM_CODE_MAX_LENGTH = 64;

export function validateAgentId(value: string): string | null {
    const trimmed = value.trim();

    if (!trimmed) {
        return 'Agent ID is required.';
    }

    // Any UUID version is accepted; the server enforces v7.
    if (!UUID_PATTERN.test(trimmed)) {
        return 'Agent ID must be a valid UUID (e.g. 0197f96c-b278-7f64-a32f-dae3cabe1ff0).';
    }

    return null;
}

export function validateClaimCode(value: string): string | null {
    const trimmed = value.trim();

    if (!trimmed) {
        return 'Claim code is required.';
    }

    if (trimmed.length < CLAIM_CODE_MIN_LENGTH || trimmed.length > CLAIM_CODE_MAX_LENGTH) {
        return `Claim code must be ${CLAIM_CODE_MIN_LENGTH}-${CLAIM_CODE_MAX_LENGTH} characters long.`;
    }

    if (!CLAIM_CODE_PATTERN.test(trimmed)) {
        return 'Claim code may contain only letters and digits.';
    }

    return null;
}

/** Returns the trimmed name, or undefined when empty so it is omitted from the request. */
export function normalizeAgentName(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed || undefined;
}
