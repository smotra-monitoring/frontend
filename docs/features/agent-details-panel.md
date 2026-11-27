# Agent Details Panel

Right-hand overlay panel that shows one agent in foldable sections: **General**, **Network** and **Config patch preview**. It is opened from the Agent States table on `/agent`.

## Behaviour

- **Open:** click anywhere on an agent row (or its chevron button). The agent is fetched (`GET /agents/{agentId}`) and General and Network are shown from the response. On first use General is expanded, Network and Config patch preview are collapsed, so the config is not fetched.
- **Config preview:** click the Desired config version in a row. The panel opens (or swaps) with Config patch preview expanded and the patch is fetched; see [Agent Config Preview](agent-config-preview.md).
- **Swap:** clicking another row or Desired button replaces the content. Section states are kept; if Config patch preview is expanded the new agent's config is fetched, otherwise another agent's config is never shown.
- **Close:** close button, `Escape`, or a click outside the panel. A click on an agent row is not "outside": it swaps. `Escape` is ignored while a modal dialog (e.g. Claim agent) is open. Escape and the close button return focus to the row's chevron; an outside click does not move focus.
- **Sections:** collapsible with a button (`aria-expanded`, `aria-controls`). Their state is **not persisted across page loads**: it lives in memory, starts at the defaults (General expanded, Network and Config collapsed) when the page loads, and keeps the user's choice across close/reopen and swaps. A section left expanded is loaded again when the panel is reopened (the config patch is cleared on close), so reopening with Config patch preview expanded fetches it again.
- **Agent data:** fetched on open and on swap, independent of the agent list, and never refetched automatically, so the panel is a fixed snapshot. While loading, General and Network show "Loading..." and the title reads "Agent details" (nothing is taken from the table row). On failure the server's message is shown, with a Retry button in General only; there is no fallback to the list. Closing or swapping discards a response still in flight. The list is not updated from the fetched agent and vice versa, so an agent that is deleted or has gone stale in the table is reported by the server (e.g. 404). The config patch follows the same fetch-on-demand rule.

## Layout

- Non-modal overlay docked to the right edge on every viewport; no scrim, the page behind stays usable.
- Under 768px it is full width, from 768px it is `min(380px, 100vw)` wide.
- Slides in with `transform`; the closed panel is `visibility: hidden`, `inert` and `aria-hidden`.
- `z-index: var(--z-index-modal-backdrop)`: above the mobile bottom nav, below toasts.
- Under `prefers-reduced-motion: reduce` the transition is removed.

## Architecture

| Piece | File | Role |
|-------|------|------|
| Panel state | `src/state/agent-details-panel-state.ts` | `{ agentId, configRequest }`; single source of truth for the selected row. `openAgentDetails()`, `closeAgentDetails()`, subscribe |
| Agent state | `src/state/agent-details-state.ts` | `{ agentId, status, data, error }` of the fetched agent. `loadAgentDetails()`, `resetAgentDetails()`, subscribe; superseded responses are discarded |
| Shell | `src/components/side-panel.ts` | Generic panel with foldable sections. Renders once, updates one section at a time (`setSectionContent`), handles toggles, Escape and outside clicks |
| Agent panel | `src/widgets/agent-details.ts` | Composes the shell with the three sections, subscribes to panel, agent details and config state, loads the agent on open/swap and the config on expand |
| Content | `src/utils/agent-details-render.ts`, `src/utils/agent-config-render.ts` | Pure HTML renderers (all values escaped); `renderAgentGeneral(state)` and `renderAgentNetwork(state)` render the loading and error states themselves |
| Trigger | `src/widgets/agent-states.ts` | Delegated row click, Desired button, row highlight |

`SidePanel` is generic: another feature can register its own sections without changes to the shell.

`configRequest` is incremented on every Desired click, so clicking Desired for the already open agent still expands a section the user had collapsed.

## Accessibility

- `<aside>` landmark labelled by its title (`aria-live="polite"`, so swaps are announced).
- Section headers are `<button>`s inside `<h3>`; bodies are `role="region"` labelled by their button.
- Focus moves to the panel when it opens; there is no focus trap because the panel is non-modal.
- Touch targets (close button, section headers, Desired button) are at least 44px.
- The selected row has `aria-current="true"`; its chevron has `aria-expanded` and `aria-controls="side-panel"`.

## Tests

- `tests/unit/state/agent-details-panel-state.test.ts`
- `tests/unit/state/agent-details-state.test.ts`
- `tests/unit/utils/agent-details-render.test.ts`
- `tests/unit/components/side-panel.test.ts`
- `tests/unit/widgets/agent-details.test.ts`
- `tests/unit/widgets/agent-states.test.ts`
- `tests/integration/agent-config-panel.test.ts`, `tests/integration/agents-page.test.ts`

## Not included

The panel is only mounted on the Agents page. Config history, editing the config and persisting section state are out of scope.
