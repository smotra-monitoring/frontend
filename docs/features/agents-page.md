# Agents Page (`/agent`)

## Overview

The Agents page is a dedicated, full-width view of the [Agent States Widget](agent-states-widget.md),
available at the `/agent` route. It gives administrators a focused agent list without the rest of the
dashboard, while keeping the same shell (sidebar, toolbar with refresh control and theme toggle,
command palette, toast notifications).

## Routing

| Path     | Component    | Strategy  |
|----------|--------------|-----------|
| `/agent` | `AgentsPage` | `private` |

- The route is registered in the exported `ROUTES` table in `src/pages/router.ts`.
- Being `private`, it is protected by `protectRoute()` — unauthenticated users are redirected to
  `/login` and returned to `/agent` after signing in.
- The sidebar **Agents** nav item links to `/agent` and is highlighted as active on this page.

## Implementation

`src/pages/agents.ts` — `AgentsPage extends BaseComponent`:

- `render()` builds the page shell (reusing the `dashboard__*` layout classes, plus `.agents-page`)
  and mounts `AgentStatesWidget` into `#agent-states-container` with the current `getAgents()` data.
- `onMount()` calls `loadAgents()`; the widget updates itself through its agent-state subscription.
  Failures surface as an error toast.

### Loading agents (`loadAgents()` in `src/state/agent-state.ts`)

`loadAgents()` fetches agents from the API server using the generated `listAgents` SDK call
(`GET /agents`, bearer-authenticated):

- The session token comes from `getValidAccessToken()` (`src/auth/token-manager.ts`), supplied through
  the SDK's `auth` callback, so an expiring token is refreshed before the request is sent.
- All pages are fetched (`page_size=100`, the server maximum) and combined, so filtering and sorting stay
  client-side. The agent list is replaced only after every page succeeded.
- API errors (e.g. `401`) are thrown as `Error` with the server's `message`; network errors propagate
  unchanged. Callers (`AgentsPage`, `DashboardPage`, `AgentStatesWidget`) handle them with toasts or logging.
- `onDestroy()` destroys all child components (widget, sidebar, toolbar controls, palette, toasts).

Periodic refresh works exactly as on the dashboard: the widget subscribes to the
[Refresh State](refresh-manager.md), controlled by the toolbar's refresh dropdown.

### Circular import fix

`Sidebar` previously imported `navigate` from `router.ts`. Because the router now imports
`AgentsPage` (which imports `Sidebar`), that created a cycle that could leave route components
`undefined` depending on module load order. The sidebar now uses `navigateTo(route, 'push')` from
`src/utils/navigation.ts`, the existing decoupled navigation registry.

## Usage

```typescript
import { navigateTo } from '../utils/navigation.js';

await navigateTo('/agent', 'push');
```

Or simply link to it: `<a href="/agent">Agents</a>` — the router intercepts same-origin links.

## Tests

- Unit: `tests/unit/pages/agents.test.ts` — rendering, widget mounting, data loading, cleanup, route registration.
- Integration: `tests/integration/agents-page.test.ts` — direct load of `/agent`, active sidebar link,
  navigation `/dashboard` → `/agent` through the router.
