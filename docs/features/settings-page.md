# Settings Page (`/settings`)

## Overview

The Settings page groups settings into sections. A section is a set of related settings that the user can fold and unfold. For now there is one section, **Active sessions**, which lists every session of the signed-in user and lets them terminate sessions.

## Routing

| Path        | Component      | Strategy  |
|-------------|----------------|-----------|
| `/settings` | `SettingsPage` | `private` |

The route is registered in `ROUTES` in `src/pages/router.ts`. The sidebar **Settings** item links to it.

## Sections and folding

Each section is a native `<details class="settings-section" open>` with a `<summary>` header.

- Folding is handled by the browser and styled with CSS (the chevron rotates via `details[open]`). Fold state is **not** kept in component state.
- Sections are **open by default**, so browser find (Ctrl+F) sees every setting.
- The `<details>` shell is rendered once. Later updates replace only its contents, so data reloads do not reset what the user folded.

## Active sessions section

`src/widgets/sessions-section.ts` — `SessionsSection extends BaseComponent`.

One line per session (most recently used first, as returned by the API). Every field of the OpenAPI `Session` schema is visible:

| Field          | Display                                             |
|----------------|-----------------------------------------------------|
| `user_agent`   | Device label (e.g. "Firefox on Linux") and raw string |
| `ip_address`   | Address, or `—` when absent                         |
| `provider`     | Identity provider                                   |
| `created_at`   | Absolute date                                       |
| `last_used_at` | Absolute date and relative time                     |
| `expires_at`   | Absolute date                                       |
| `id`           | Session ID                                          |
| `is_current`   | "This device" badge                                 |

### Terminating sessions

- **Terminate** is the last element of each line. It is disabled for the current session (`is_current`), which cannot be terminated from this page.
- **Terminate All** is at the top of the section and calls `DELETE /sessions`, which revokes every session except the current one. It is disabled when no other session exists.
- Both use an inline **two-step confirmation**: the first click turns the button into "Confirm?"; a second click performs the action. The button disarms after 4 seconds or when it loses focus. The armed state is a DOM attribute (`data-confirming`), not component state.
- After an action the list is reloaded and a toast reports the result. A `404` on a single terminate (already gone) just reloads the list.

### Loading

Sessions load on mount and after each action. There is no periodic refresh.

## API

`src/services/session-service.ts` wraps the generated SDK (bearer token from `getValidAccessToken()`):

| Function                   | Endpoint                       |
|----------------------------|--------------------------------|
| `fetchSessions()`          | `GET /sessions`                |
| `terminateSession(id)`     | `DELETE /sessions/{session_id}` |
| `terminateOtherSessions()` | `DELETE /sessions`             |

Failures throw `SessionServiceError` carrying the HTTP `status`.

## Accessibility

- Native `<details>`/`<summary>` keyboard support; 44px minimum touch targets.
- Terminate buttons have device-specific `aria-label`s that change while armed; a polite `role="status"` region announces loading and counts; errors use `role="alert"`.
- After an action keyboard focus moves to the section summary, because the clicked button is re-rendered.
- Chevron animation is disabled under `prefers-reduced-motion`.

## Tests

- Unit: `tests/unit/widgets/sessions-section.test.ts`, `tests/unit/pages/settings.test.ts`, `tests/unit/services/session-service.test.ts`, `tests/unit/utils/user-agent.test.ts`.
- Integration: `tests/integration/settings-page.test.ts` — direct load, active sidebar link, terminate one, Terminate All.
