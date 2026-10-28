/**
 * Minimal User-Agent description for display ("Firefox on Linux").
 * Not a full parser: unknown agents fall back to generic labels.
 */

// Order matters: Edge/Opera UAs also contain "Chrome", Chrome UAs contain "Safari".
const BROWSERS: ReadonlyArray<[RegExp, string]> = [
    [/Edg(?:e|A|iOS)?\//, 'Edge'],
    [/OPR\/|Opera/, 'Opera'],
    [/Firefox\/|FxiOS\//, 'Firefox'],
    [/Chrome\/|CriOS\//, 'Chrome'],
    [/Safari\//, 'Safari'],
    [/curl\//i, 'curl'],
];

// Order matters: Android UAs contain "Linux", iOS UAs contain "Mac OS X".
const SYSTEMS: ReadonlyArray<[RegExp, string]> = [
    [/Android/, 'Android'],
    [/iPhone|iPad|iPod/, 'iOS'],
    [/Windows/, 'Windows'],
    [/Mac OS X|Macintosh/, 'macOS'],
    [/CrOS/, 'ChromeOS'],
    [/Linux|X11/, 'Linux'],
];

export function describeDevice(userAgent: string | null | undefined): string {
    if (!userAgent) {
        return 'Unknown device';
    }

    const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
    const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];

    if (browser && system) return `${browser} on ${system}`;
    return browser ?? system ?? 'Unknown device';
}

export function isMobile(userAgent: string | null | undefined): boolean {
    if (!userAgent) return false;
    return /Mobile|iPhone|iPad|iPod|Android/.test(userAgent);
}