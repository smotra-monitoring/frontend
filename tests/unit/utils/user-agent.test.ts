import { describe, it, expect } from 'vitest';
import { describeDevice } from '../../../src/utils/user-agent.js';

describe('describeDevice', () => {
    it.each([
        ['Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0', 'Firefox on Linux'],
        ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', 'Chrome on Windows'],
        ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36 Edg/126.0', 'Edge on Windows'],
        ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15', 'Safari on macOS'],
        ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1', 'Safari on iOS'],
        ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36', 'Chrome on Android'],
        ['curl/8.5.0', 'curl'],
    ])('describes %s', (ua, expected) => {
        expect(describeDevice(ua)).toBe(expected);
    });

    it('returns a generic label for missing or unrecognised agents', () => {
        expect(describeDevice(undefined)).toBe('Unknown device');
        expect(describeDevice('')).toBe('Unknown device');
        expect(describeDevice('SomethingOdd/1.0')).toBe('Unknown device');
    });

    it('returns only the system when the browser is unknown', () => {
        expect(describeDevice('Foo (Windows NT 10.0)')).toBe('Windows');
    });
});
