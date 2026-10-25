import { describe, it, expect } from 'vitest';
import {
    normalizeAgentName,
    validateAgentId,
    validateClaimCode,
} from '../../../src/utils/claim-validation.js';

describe('validateAgentId', () => {
    it('accepts a UUID, ignoring surrounding whitespace', () => {
        expect(validateAgentId('0197f96c-b278-7f64-a32f-dae3cabe1ff0')).toBeNull();
        expect(validateAgentId('  0197F96C-B278-7F64-A32F-DAE3CABE1FF0 ')).toBeNull();
    });

    it('rejects empty and whitespace-only values', () => {
        expect(validateAgentId('')).toBe('Agent ID is required.');
        expect(validateAgentId('   ')).toBe('Agent ID is required.');
    });

    it.each(['not-a-uuid', '0197f96c-b278-7f64-a32f', '0197f96cb2787f64a32fdae3cabe1ff0', '0197f96c-b278-7f64-a32f-dae3cabe1ffz'])(
        'rejects malformed value %s',
        (value) => {
            expect(validateAgentId(value)).toMatch(/valid UUID/);
        }
    );
});

describe('validateClaimCode', () => {
    it('accepts 4-64 alphanumeric characters, trimmed', () => {
        expect(validateClaimCode('ABC123XY')).toBeNull();
        expect(validateClaimCode(' abcd ')).toBeNull();
        expect(validateClaimCode('a'.repeat(64))).toBeNull();
    });

    it('rejects empty values', () => {
        expect(validateClaimCode('')).toBe('Claim code is required.');
    });

    it('rejects values outside the length range', () => {
        expect(validateClaimCode('abc')).toMatch(/4-64 characters/);
        expect(validateClaimCode('a'.repeat(65))).toMatch(/4-64 characters/);
    });

    it('rejects non-alphanumeric characters', () => {
        expect(validateClaimCode('abc-1234')).toMatch(/letters and digits/);
        expect(validateClaimCode('abc 1234')).toMatch(/letters and digits/);
    });
});

describe('normalizeAgentName', () => {
    it('trims the name', () => {
        expect(normalizeAgentName('  Prod 01 ')).toBe('Prod 01');
    });

    it('returns undefined for empty input', () => {
        expect(normalizeAgentName('   ')).toBeUndefined();
        expect(normalizeAgentName('')).toBeUndefined();
    });
});
