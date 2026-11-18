---
description: "Error handling rules: every failure cause gets its own user-facing message, never a generic catch-all. Use when handling API errors, async failures, or writing error messages in any feature."
applyTo: "src/**"
---

# Error Handling: Distinct Messages

Every distinct failure cause shown to the user must have its own message. Never reuse one generic message ("Something went wrong") for different causes.

## Rules

- **One message per cause.** Map each documented API error response (see `responses` in `api/openapi/api/spec.yaml`) and each client-side failure to a separate message:
  - 401 session expired, 403 no permission, 404 not found, 409 conflict, 5xx server problem, no response (network).
  - Cover every status the operation documents; add a fallback that includes the HTTP status, e.g. `Unexpected error (HTTP 418).`
- **Say what happened and, where useful, what to do.** No raw server text unless the spec guarantees it is user-safe (e.g. validation messages).
- **Mapping lives in one pure function** (`describeXError(status | undefined)`) in `src/utils/`, returning `{ kind, message, status?, retryable }`. Messages are named constants so tests can assert on them.
- **Retry only when it can help:** 503, network and unknown errors are retryable; 401, 403, 404, 501 are not.
- **State functions never throw to the UI.** Store the mapped error in state; treat a thrown request as `network`.
- **Discard stale responses** (request counter) so an old failure cannot overwrite a newer result.
- **Announce errors accessibly:** `role="alert"` (or an `aria-live` region), shown next to the content that failed, not only as a toast.
- **Escape messages** with `escapeHtml()` before rendering.

## Tests

Each new mapping needs a unit test that asserts every status maps to its own message (all messages unique), plus the network and fallback cases.

## Reference implementations

- `src/utils/agent-config-errors.ts`
- `ClaimAgentModal.describeError` in `src/components/claim-agent-modal.ts`
