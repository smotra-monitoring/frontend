# Agent States Widget

**Status**: ✅ Implemented  
**Version**: 0.1.0  
**Last Updated**: November 18, 2026

## Overview

The **Agent States Widget** is a self-contained table-based component that displays the list of monitoring agents with sortable columns. Clicking a row opens the [Agent Details Panel](agent-details-panel.md), an overlay on the right with the agent's full information; the Desired config version in each row opens the panel with its config patch preview. It replaces the previous Bento-Box card layout as the primary dashboard view, providing a more information-dense and efficient interface for managing multiple agents.

## Key Features

- **Table Layout**: Clean, responsive table showing agent name, status, and last seen timestamp
- **Sortable Columns**: Click column headers to sort by Name, Status, or Last Seen (ascending/descending)
- **Details Side Panel**: Click anywhere on an agent's row (or its chevron button) to open the [Agent Details Panel](agent-details-panel.md); the selected row is highlighted
- **Config Patch Preview**: The Desired config version is a button that opens the panel with the stored configuration patch fetched and shown
- **Status Derivation**: Agent status (online/offline/unknown) is derived from `lastSeenAt` timestamp using a configurable threshold
- **Real-Time Updates**: Subscribes to agent state changes for automatic updates
- **Accessibility**: Full WCAG 2.1 AA compliance with keyboard navigation and screen reader support
- **Performance**: Selection is updated by direct DOM changes, so opening and closing the panel never re-renders the table

## Design Decisions

### Table vs. Cards

The widget uses a table layout instead of the previous Bento-Box cards for several reasons:

1. **Information Density**: Tables display more agents per screen, reducing scrolling
2. **Scanning Efficiency**: Vertical alignment makes it easier to scan agent names and statuses
3. **Sorting**: Column-based sorting is more intuitive in a table format
4. **Scalability**: Tables handle 50+ agents better than card grids

### In-Place Selection Updates

The panel state (`state/agent-details-panel-state.ts`) is the single source of truth for which row is selected. The widget reads it in `render()` so sorting and refreshes keep the highlight, and subscribes to it to update the rows **directly in the DOM** when the panel opens, swaps or closes:

```typescript
// ✅ Direct DOM update: rows and focus survive
row.classList.toggle('agent-states-row--selected', selected);

// ❌ Avoided: a re-render would drop the focus of the button that was just clicked
this.setState({ selectedAgentId });
```

### Status Derivation

Agent status is **derived** from the `lastSeenAt` timestamp, not stored as a field:

- **Online**: `lastSeenAt` < 5 minutes ago (configurable via `AGENT_ONLINE_THRESHOLD_MS`)
- **Offline**: `lastSeenAt` ≥ 5 minutes ago
- **Unknown**: `lastSeenAt` is null (agent never connected)

This approach:
- Eliminates the need for a separate `status` field in the database
- Ensures status is always current (no stale data)
- Centralizes the logic in `deriveAgentStatus()` utility

## Architecture

### Component Structure

```
AgentStatesWidget (extends BaseComponent)
│
├── State
│   ├── agents: Agent[]          // Array of AgentListItem from OpenAPI
│   ├── loading: boolean         // Loading indicator
│   └── sort: SortOptions        // Current sort field and direction
│
├── Methods
│   ├── render()                 // Main render method
│   ├── renderTable()            // Table structure
│   ├── renderAgentRow()         // Individual agent row
│   ├── handleSort()             // Sort logic (updates state)
│   ├── handleRowClick()         // Delegated click: opens the details panel
│   └── updateSelection()        // Row highlight + aria-expanded (no state)
│
└── Subscription
    ├── subscribeToAgents()            // Real-time agent updates
    └── subscribeToAgentDetailsPanel() // Selected row highlight
```

### Data Flow

1. **Initial Load**: `DashboardGrid` passes `getAgents()` result to widget constructor
2. **Subscription**: Widget subscribes to `subscribeToAgents()` for real-time updates
3. **State Update**: When agents change, `setState({ agents })` triggers re-render
4. **Sorting**: User clicks column header → `handleSort()` → `setState({ sort })` → re-render with new order
5. **Open details**: One delegated click listener on the widget root. A click on the Desired button calls `openAgentDetails(id, { expandConfig: true })`; any other click inside a `[data-agent-row]` calls `openAgentDetails(id)`. Keyboard activation of the chevron or Desired button bubbles as a click, so each action fires exactly once.

### Row Highlight CSS

```css
.agent-states-table tbody tr.agent-states-row--selected {
  background-color: var(--color-bg-secondary);
  box-shadow: inset 3px 0 0 var(--color-primary);
}
```

## Integration with DashboardGrid

The `DashboardGrid` component was refactored from an "agent-card factory" to a "widget layout shell":

**Before** (Phases 1-5):
```typescript
// DashboardGrid created AgentCard instances
this.state.agents.forEach(agent => {
  const card = new AgentCard(cardElement, agent);
  card.mount();
});
```

**After** (Phase 6+):
```typescript
// DashboardGrid mounts AgentStatesWidget
const widget = new AgentStatesWidget(widgetContainer, agents);
widget.mount();
```

This architecture:
- Decouples dashboard layout from widget implementation
- Allows future addition of multiple widgets (charts, alerts, etc.)
- Preserves CSS Grid layout for future multi-widget scenarios

## Usage

### Basic Usage

```typescript
import { AgentStatesWidget } from './components/agent-states-widget.js';
import { getAgents } from './state/agent-state.js';

// Get agents from state
const agents = getAgents();

// Create widget
const container = document.querySelector('#dashboard-content');
const widget = new AgentStatesWidget(container, agents);

// Mount to DOM
widget.mount();

// Widget automatically subscribes to agent updates
```

### With Loading State

```typescript
const widget = new AgentStatesWidget(container, []);
widget.mount();

// Show loading spinner
widget.setLoading(true);

// Fetch agents...
const agents = await fetchAgents();
widget.setState({ agents, loading: false });
```

### Programmatic Sorting

```typescript
// Sort by status, descending
widget.setState({
  sort: { field: 'status', direction: 'desc' }
});
```

## Agent Data Structure

The widget uses the `Agent` type, which is a re-export of `AgentListItem` from the OpenAPI SDK:

```typescript
interface Agent {
  id: string;                           // UUIDv7
  workspace_id: string;                  // Workspace (parent of agents and users) this agent belongs to
  name: string;                          // Display name
  agent_version: string | null;          // e.g., "1.0.0"
  config_version_desired: number;        // Config version the server wants the agent to run
  config_version_current?: number | null; // Config version last reported by the agent (null = not yet reported)
  ip_addresses?: AgentNetworkInterface[]; // Array of IP addresses
  last_seen_at: Date | null;             // Last heartbeat timestamp
  last_result_submitted_at: Date | null; // Last result submission
  created_at: Date;                      // Agent creation timestamp
  updated_at: Date;                      // Last update timestamp
}
```

### Displayed Information

**Main Row**:
- Name
- Status badge (online/offline/unknown with pulse indicator)
- Agent version
- Config version: current / desired (the desired version is a button)
- Last Seen (relative time: "Just now", "5 minutes ago", etc.)
- Chevron button (opens the details panel)

**Details** (in the side panel, see [Agent Details Panel](agent-details-panel.md)):
- General: status, agent ID, workspace ID, agent version, config versions, last seen, last result submitted, created, updated
- Network: IP addresses with interface name and recommended flag
- Config patch preview: fetched on demand

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between sortable headers and chevron buttons
- **Enter/Space**: Activate sort, open the details panel from the chevron, or open the config preview from the Desired button
- The chevron and the Desired version are native, focusable buttons for keyboard and screen reader users; their activation bubbles to the same delegated click handler, opening the panel exactly once.
- **Arrow Keys**: Navigate within table (browser default)

### ARIA Attributes

- `aria-sort="ascending|descending|none"` on sortable column headers
- `aria-expanded="true|false"` on chevron buttons (true while that agent is open in the panel)
- `aria-controls="side-panel"` linking chevron to the panel
- `aria-current="true"` on the selected row
- `role="status"` on status badges

### Screen Readers

All status badges, timestamps, and interactive elements have descriptive labels:

```html
<button aria-label="Show details for Agent 1">
  <i class="fas fa-chevron-right" aria-hidden="true"></i>
</button>
<button aria-label="Show desired configuration, version 3, for Agent 1">3</button>
```

### Reduced Motion

The panel's slide transition is disabled under `prefers-reduced-motion: reduce` (see `animations.css`).

## Performance

### Optimization Techniques

1. **CSS Containment**: `contain: layout style` on widget container for faster rendering
2. **No Re-renders on Selection**: Direct DOM updates avoid re-rendering the table when the panel opens, swaps or closes
3. **Efficient Sorting**: Uses native array sorting, only re-renders when sort changes
4. **Lazy Rendering**: Could add virtual scrolling for 1000+ agents (not currently needed)

### Benchmarks

- **Render Time**: < 50ms for 50 agents (tested on modern desktop)
- **Memory**: ~5KB per agent (JavaScript objects + DOM elements)

## Testing

Unit tests in `tests/unit/widgets/agent-states.test.ts`:

- **Rendering**: Widget structure, empty state, loading state, Desired button, no inline detail rows
- **Sorting**: Default sort, toggle direction, active indicator
- **Opening the panel**: Row, chevron and Desired clicks, swap, sort buttons do not open it
- **Selected row**: Highlight, `aria-current`, survives re-render, focus kept
- **Accessibility**: ARIA attributes, keyboard navigation
- **XSS Protection**: HTML escaping in agent names

Integration: `tests/integration/agents-page.test.ts` and `tests/integration/agent-config-panel.test.ts`.

## Known Limitations

1. **No Pagination**: Currently displays all agents in a single table. For 1000+ agents, consider implementing virtual scrolling or pagination.

2. **No Persisted Sort**: Sort preference is not saved to localStorage. User must re-sort on each page load.

3. **Fixed Column Widths**: Column widths are percentages (40%, 20%, 30%, 10%). Could make them resizable in the future.

## Future Enhancements

### Short-Term

- [ ] Add filter controls (by status, workspace, version)
- [ ] Implement search/filter bar above table
- [ ] Add "Export to CSV" button
- [ ] Persist sort and filter preferences to localStorage

### Long-Term

- [ ] Virtual scrolling for 1000+ agents
- [ ] Drag-to-reorder columns
- [ ] Resizable columns
- [ ] Bulk actions (select multiple agents, apply action)
- [ ] Agent health charts in the details panel
- [ ] Link to agent detail page

## Related Documentation

- [Project Overview](../../README.md)
- [Component Architecture](../ARCHITECTURE.md#components)
- [Agent State Management](../ARCHITECTURE.md#state-management)
- [Testing Strategy](../testing/TESTING_SUMMARY.md)
- [Accessibility Guidelines](../../.github/instructions/accessibility.instructions.md)

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for version history.
