/**
 * Application route constants, definitions, and helpers.
 *
 * This is the SINGLE source of truth for all routing configuration.
 * To add a new page: add an import, extend PageConstructor, and add one entry to ROUTE_DEFINITIONS.
 *
 * Circular import note: this file imports page modules (login.ts, oauth-callback.ts) which in
 * turn import `routes` from this file. The circular dep is safely broken by wrapping component
 * references in lazy getters (`component: () => LoginPage`). ES modules use live bindings, so
 * by the time any navigation code calls `component()`, all modules are fully initialized.
 */

import { LoginPage } from './login.js';
import { OAuthCallbackPage } from './oauth-callback.js';
import { DashboardPage } from './dashboard.js';
import { isAuthenticated } from '../state/auth-state.js';

/** Union of all page component constructors. */
export type PageConstructor = typeof LoginPage | typeof OAuthCallbackPage | typeof DashboardPage;

/**
 * A single route definition.
 * - `protected`: requires the user to be authenticated
 * - `public`: redirects away if the user is already authenticated (login/callback pages)
 * - `default_for`: marks this route as the redirect target for the given auth state
 * - `component`: lazy getter returning the page constructor (deferred to break circular imports)
 */
export interface Route {
    path: string;
    component: () => PageConstructor;
    protected: boolean;
    public?: boolean;
    default_for?: 'authenticated' | 'unauthenticated';
}


/**
 * All route definitions — the only place to update when adding a new page.
 * The `default_for` field drives all redirect-target decisions across the application.
 */
export class Routes {

    private routes: Route[] = [
        { path: '/', component: () => DashboardPage, protected: true },
        { path: '/dashboard', component: () => DashboardPage, protected: true, default_for: 'authenticated' },
        { path: '/login', component: () => LoginPage, protected: false, public: true, default_for: 'unauthenticated' },
        { path: '/auth/callback', component: () => OAuthCallbackPage, protected: false, public: true },
    ];

    getRoutes(): Route[] {
        return this.routes;
    }

    /**
     * Find route by path
     */
    findRoute(path: string): Route {
        // Exact match
        let route = this.getRoutes().find(r => r.path === path);

        if (route) {
            return route;
        }

        // Fall back to the route declared as default for the current auth state
        const defaultRoute = isAuthenticated() ? this.defaultAuthenticated() : this.defaultUnauthenticated();
        return this.getRoutes().find(r => r.path === defaultRoute.path)!;
    }

    defaultAuthenticated(): Route {
        const route = this.routes.find(r => r.default_for === 'authenticated');
        if (!route) {
            console.warn('No default route found for authenticated users. Falling back to /dashboard');
            return this.routes.find(r => r.path === '/dashboard')!;
        }

        return route;
    }

    defaultUnauthenticated(): Route {
        const route = this.routes.find(r => r.default_for === 'unauthenticated');

        if (!route) {
            console.warn('No default route found for unauthenticated users. Falling back to /login');
            return this.routes.find(r => r.path === '/login')!;
        }

        return route;
    }

}

const routes = new Routes();

export function getRoutes(): Routes {
    return routes;
}

export function findRoute(path: string): Route {
    return routes.findRoute(path);
}

