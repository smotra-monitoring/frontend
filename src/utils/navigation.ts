/**
 * Navigation registry
 *
 * Provides a decoupled way to trigger SPA navigation from modules that cannot
 * import the router directly (e.g. auth-guard, auth-service) without creating
 * a circular dependency.
 *
 * The router registers its `navigate` function here on init.
 * All internal redirects must call `navigateTo()` instead of setting
 * `window.location.href` so that the SPA never reloads the page.
 */

type NavigateFn = (path: string, historyMode?: 'push' | 'replace' | 'none') => Promise<void>;

let _navigate: NavigateFn | null = null;

/**
 * Called once by the router after it is constructed.
 */
export function registerNavigate(fn: NavigateFn): void {
    _navigate = fn;
}

/**
 * Navigate to an internal SPA route without a full page reload.
 * Defaults to 'replace' so internal redirects don't pollute the back-stack.
 *
 * Falls back to `history.replaceState` if the router has not yet registered
 * (should not happen in normal app flow).
 */
export async function navigateTo(
    path: string,
    historyMode: 'push' | 'replace' | 'none' = 'replace'
): Promise<void> {
    if (_navigate) {
        await _navigate(path, historyMode);
    } else {
        console.warn('Navigate function not registered yet. Falling back to full page navigation.');
        window.history.replaceState({}, '', path);
    }
}
