# Agents Summary Widget

## Overview

A compact dashboard tile that replaces the full agent list on the dashboard. It shows two numbers,
`online/total`, a short caption, and a health pulse. The whole tile is a link to the
[Agents page](agents-page.md) (`/agent`), where the full [Agent States Widget](agent-states-widget.md) lives.

```
● AGENTS            >
12/15        3 offline
```

## Health states

| Condition            | Pulse             | Caption       |
|----------------------|-------------------|---------------|
| all agents online    | green, pulsing    | `All online`  |
| some agents offline  | yellow, pulsing   | `N offline`   |
| no agent online      | red               | `N offline`   |
| no agents            | grey              | `No agents`   |

"Online" is derived from `lastSeenAt` via `deriveAgentStatus()`.

## Implementation

- `src/widgets/agents-summary.ts` — `AgentsSummaryWidget extends BaseComponent`.
- Subscribes to agent state (`subscribeToAgents`) and to the refresh manager (reloads via `loadAgents()`).
- Click is routed through `navigateTo('/agent', 'push')` (no page reload).
- `DashboardGrid` hosts the tile in a `repeat(auto-fill, minmax(220px, 1fr))` grid so additional tiles
  sit side by side.
- Styles: `.agents-summary*` in `public/css/components.css`.

## Accessibility

- Rendered as a real `<a href="/agent">` with an `aria-label` such as
  `Agents: 12 of 15 online. 3 offline. Open agents list`.
- Visible focus ring, 120px minimum height (well above the 44px touch target).
- Pulse animation and hover transform are disabled under `prefers-reduced-motion`.
