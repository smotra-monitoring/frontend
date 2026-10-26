# Agent Claim

## Overview

New agents register themselves as *pending* and print an agent ID and a claim code in their logs.
An administrator claims the agent from the [Agents page](agents-page.md) by entering both values in a modal
form. The agent list refreshes automatically on success, with no page reload.

## User flow

1. Click **Claim** in the Agents page toolbar.
2. Enter the **Agent ID** (UUID), the **Claim code** and, optionally, an **Agent name**
   (defaults to the agent's hostname on the server).
3. Submit. The modal shows "Claiming…", then either an error or the server's success message.
4. On success the modal closes after about 1.5 s, a success toast is shown and the agent list reloads.

Both values can be pasted from the clipboard with the paste button beside each field. Pasting fills and
validates the field but never submits.

## API

`POST /agent/claim` through the generated `postClaimAgent()` SDK call (bearer-authenticated).

| Form field   | Request field | Notes                      |
|--------------|---------------|----------------------------|
| Agent ID     | `agentId`     | UUID                       |
| Claim code   | `claimToken`  | 4-64 letters/digits        |
| Agent name   | `name`        | Optional, trimmed; omitted when empty |

### Error handling

| Status | Message shown                                      | Field flagged |
|--------|----------------------------------------------------|---------------|
| 400    | Server message (or a generic fallback)             | -             |
| 401    | Session expired, sign in again                     | -             |
| 403    | Claim code invalid or expired (`CLAIM_TOKEN_INVALID`)     | Claim code |
| 404    | No pending registration (`AGENT_CLAIM_NOT_FOUND`)  | Agent ID      |
| 409    | Already claimed (`AGENT_ALREADY_CLAIMED`)          | Agent ID      |
| 5xx    | Server error, try again later                      | -             |
| none   | Network failure                                    | -             |

The form stays editable after an error so the user can correct and resubmit.

## Implementation

- `src/utils/claim-validation.ts` - `validateAgentId()`, `validateClaimCode()`, `normalizeAgentName()`.
  Validators return an error message or `null`.
- `src/components/claim-agent-modal.ts` - `ClaimAgentModal extends BaseComponent`.
  - Field values live in component state because `setState()` re-renders; typing does not trigger a render.
  - Closing (button, Esc, overlay) works at any time. It cancels the auto-close timer, ignores a late
    response and returns focus to the element that opened the modal.
  - `onClaimed` / `onFailed` callbacks let the page show toasts.
- `src/pages/agents.ts` - toolbar **Claim** button, `#claim-modal-container` and toast wiring.
- `public/css/components.css` - `.claim-modal__*` styles, reusing the `.command-palette__*` overlay and modal.

## Accessibility

- `role="dialog"`, `aria-modal`, labelled title, focus trap, Esc to close.
- Inline errors use `aria-invalid` and `aria-describedby`; the status region is `role="alert"` on errors.
- All controls have 44px touch targets; mobile gets a full-screen modal with actions at the bottom.
- Spinner animation and transitions are disabled under `prefers-reduced-motion`.

## Clipboard paste

Paste buttons use `navigator.clipboard.readText()`, which needs a secure context (HTTPS or localhost) and
may prompt for permission.

- Without the Clipboard API the buttons are not rendered.
- If the read is denied or fails, the field shows "Clipboard access denied. Paste with Ctrl+V instead."

## Tests

- `tests/unit/utils/claim-validation.test.ts`
- `tests/unit/components/claim-agent-modal.test.ts`
- `tests/unit/pages/agents.test.ts`
- `tests/integration/agent-claim.test.ts`
