# Agent States Widget

**Status**: ✅ Implemented  
**Version**: 0.1.0  
**Last Updated**: June 3, 2026

## Overview

The **Agent States Widget** is a self-contained table-based component that displays the list of monitoring agents with sortable columns and CSS-only expandable rows. It replaces the previous Bento-Box card layout as the primary dashboard view, providing a more information-dense and efficient interface for managing multiple agents.

## Key Features

- **Table Layout**: Clean, responsive table showing agent name, status, and last seen timestamp
- **Sortable Columns**: Click column headers to sort by Name, Status, or Last Seen (ascending/descending)
- **Expandable Details**: Click chevron button to reveal full agent information with smooth CSS transitions
- **Status Derivation**: Agent status (online/offline/unknown) is derived from `lastSeenAt` timestamp using a configurable threshold
- **Real-Time Updates**: Subscribes to agent state changes for automatic updates
- **Toggle All**: Single button to expand or collapse all agent details at once
- **Accessibility**: Full WCAG 2.1 AA compliance with keyboard navigation and screen reader support
- **Performance**: CSS-only expand/collapse means zero re-renders and smooth 60fps animations

## Design Decisions

### Table vs. Cards

The widget uses a table layout instead of the previous Bento-Box cards for several reasons:

1. **Information Density**: Tables display more agents per screen, reducing scrolling
2. **Scanning Efficiency**: Vertical alignment makes it easier to scan agent names and statuses
3. **Sorting**: Column-based sorting is more intuitive in a table format
4. **Scalability**: Tables handle 50+ agents better than card grids

### CSS-Only Expand/Collapse

A critical design decision was to implement expand/collapse using **direct DOM manipulation** rather than React-style state updates:

```typescript
// ✅ Correct: Direct DOM manipulation (no re-render)
detailsRow.classList.toggle('is-expanded');

// ❌ Avoided: State-driven re-render (breaks CSS transitions)
this.setState({ expandedRows: [...expandedRows, agentId] });
```

**Why?** When you re-render the component, the DOM elements are destroyed and recreated. This breaks CSS transitions because the browser can't animate between destroyed and new elements. By toggling CSS classes directly, we preserve the DOM elements and allow smooth `max-height` and `opacity` transitions.

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
│   ├── renderAgentRow()         // Individual agent row + detail row
│   ├── handleSort()             // Sort logic (updates state)
│   ├── toggleAgentDetails()     // CSS-only expand/collapse (no state)
│   └── toggleAllDetails()       // CSS-only expand-all/collapse-all (no state)
│
└── Subscription
    └── subscribeToAgents()      // Real-time agent updates
```

### Data Flow

1. **Initial Load**: `DashboardGrid` passes `getAgents()` result to widget constructor
2. **Subscription**: Widget subscribes to `subscribeToAgents()` for real-time updates
3. **State Update**: When agents change, `setState({ agents })` triggers re-render
4. **Sorting**: User clicks column header → `handleSort()` → `setState({ sort })` → re-render with new order
5. **Expand/Collapse**: User clicks chevron → `toggleAgentDetails()` → **direct DOM manipulation** (no state, no re-render)

### CSS Transitions

```css
/* Collapsed state */
.agent-states-row__details {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 300ms ease, opacity 200ms ease;
}

/* Expanded state */
.agent-states-row__details.is-expanded {
  max-height: 800px;
  opacity: 1;
}
```

The `max-height` and `opacity` transitions create a smooth expand/collapse animation. Using `overflow: hidden` prevents content from showing before the transition completes.

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
  sectionId: string;                    // Section this agent belongs to
  name: string;                         // Display name
  agentVersion: string | null;          // e.g., "1.0.0"
  configVersion: number;                // Config version number
  ipAddresses?: AgentNetworkInterface[]; // Array of IP addresses
  lastSeenAt: Date | null;              // Last heartbeat timestamp
  lastResultSubmittedAt: Date | null;   // Last result submission
  createdAt: Date;                      // Agent creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

### Displayed Information

**Main Row**:
- Name
- Status badge (online/offline/unknown with pulse indicator)
- Last Seen (relative time: "Just now", "5 minutes ago", etc.)
- Chevron button

**Expanded Details**:
- Agent ID (UUID)
- Section ID
- Agent Version
- Config Version
- IP Addresses (all interfaces, with iface name and recommended flag)
- Last Result Submitted (absolute timestamp)
- Last Seen (absolute timestamp)
- Created At
- Updated At

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between sortable headers and chevron buttons
- **Enter/Space**: Activate sort or toggle expand/collapse
- **Arrow Keys**: Navigate within table (browser default)

### ARIA Attributes

- `aria-sort="ascending|descending|none"` on sortable column headers
- `aria-expanded="true|false"` on chevron buttons
- `aria-controls="details-row-id"` linking chevron to detail row
- `aria-hidden="true|false"` on detail rows
- `role="status"` on status badges

### Screen Readers

All status badges, timestamps, and interactive elements have descriptive labels:

```html
<button aria-label="Toggle details for Agent 1">
  <i class="fas fa-chevron-down"></i>
</button>
```

### Reduced Motion

Respects `prefers-reduced-motion: reduce` media query:

```css
@media (prefers-reduced-motion: reduce) {
  .agent-states-row__details {
    transition: none;
  }
}
```

## Performance

### Optimization Techniques

1. **CSS Containment**: `contain: layout style` on widget container for faster rendering
2. **No Re-renders on Expand**: Direct DOM manipulation avoids component re-renders
3. **Efficient Sorting**: Uses native array sorting, only re-renders when sort changes
4. **Lazy Rendering**: Could add virtual scrolling for 1000+ agents (not currently needed)

### Benchmarks

- **Render Time**: < 50ms for 50 agents (tested on modern desktop)
- **Expand/Collapse**: 60fps smooth animation on all tested devices
- **Toggle All**: < 100ms to expand/collapse all rows
- **Memory**: ~5KB per agent (JavaScript objects + DOM elements)

## Testing

Comprehensive unit tests in `tests/unit/components/agent-states-widget.test.ts`:

- **Rendering**: Widget structure, empty state, loading state
- **Sorting**: Default sort, toggle direction, active indicator
- **Expand/Collapse**: Single row, multiple rows, toggle all
- **Accessibility**: ARIA attributes, keyboard navigation
- **XSS Protection**: HTML escaping in agent names

**Test Coverage**: 20 unit tests, all passing

## Known Limitations

1. **No Pagination**: Currently displays all agents in a single table. For 1000+ agents, consider implementing virtual scrolling or pagination.

2. **Sort State Lost on Expand**: When user sorts the table, all expanded rows are collapsed (because sorting triggers a re-render). This is acceptable but could be improved by storing expanded state separately.

3. **No Persisted Sort**: Sort preference is not saved to localStorage. User must re-sort on each page load.

4. **Fixed Column Widths**: Column widths are percentages (40%, 20%, 30%, 10%). Could make them resizable in the future.

## Future Enhancements

### Short-Term

- [ ] Add filter controls (by status, section, version)
- [ ] Implement search/filter bar above table
- [ ] Add "Export to CSV" button
- [ ] Persist sort and filter preferences to localStorage

### Long-Term

- [ ] Virtual scrolling for 1000+ agents
- [ ] Drag-to-reorder columns
- [ ] Resizable columns
- [ ] Bulk actions (select multiple agents, apply action)
- [ ] Agent health charts in expanded view
- [ ] Link to agent detail page

## Related Documentation

- [Project Overview](../../README.md)
- [Component Architecture](../ARCHITECTURE.md#components)
- [Agent State Management](../ARCHITECTURE.md#state-management)
- [Testing Strategy](../testing/TESTING_SUMMARY.md)
- [Accessibility Guidelines](../../.github/instructions/accessibility.instructions.md)

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for version history.
