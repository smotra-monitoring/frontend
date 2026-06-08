# Refresh Manager Feature

## Overview

The Refresh Manager is a centralized service that manages periodic data polling for dashboard widgets. It provides a clean, pub/sub-based architecture that allows widgets to automatically refresh their data at user-configurable intervals.

## Design Principles

- **Centralized Control**: A single service manages the global refresh interval
- **State-Based**: Built on the existing `global-state` pattern for consistency
- **Decoupled**: Widgets subscribe to refresh events without knowing implementation details
- **User-Controlled**: UI component allows users to select refresh frequency

## Architecture

### Components

1. **Refresh State** (`src/state/refresh-state.ts`)
   - Manages a single `setInterval` timer
   - Uses `global-state` for pub/sub functionality
   - Exposes subscription API for widgets
   - Handles frequency changes dynamically

2. **RefreshControl Component** (`src/components/refresh-control.ts`)
   - Clean dropdown select for frequency selection
   - Labeled control ("Refresh:") visible on desktop, compact on mobile
   - Minimal, modern styling consistent with project design guidelines
   - WCAG 2.1 AA accessible with proper touch targets (44px minimum)
   - Smooth hover effects and focus indicators
   - Integrates with RefreshManager
   - Placed in dashboard toolbar

3. **Widget Integration**
   - Widgets subscribe to refresh ticks in their lifecycle
   - Automatic cleanup when widget is destroyed
   - Example: `AgentStatesWidget`

## Usage

### For Widget Developers

To make a widget respond to refresh ticks:

```typescript
import { subscribeToRefresh } from '../state/refresh-state.js';
import { loadAgents } from '../state/agent-state.js';

export class MyWidget extends BaseComponent<MyWidgetState> {
  constructor(root: HTMLElement) {
    super(root, { /* initial state */ });

    // Subscribe to refresh ticks
    this.addSubscription(
      subscribeToRefresh(() => {
        // Refresh your data here
        this.setLoading(true);
        loadAgents().catch(error => {
          console.error('Failed to refresh data:', error);
          this.setLoading(false);
        });
      })
    );
  }

  render(): void {
    // Your render logic
  }
}
```

The `addSubscription` method from `BaseComponent` ensures automatic cleanup when the widget is destroyed.

### For Dashboard Integration

Add the `RefreshControl` to the dashboard toolbar:

```typescript
import { RefreshControl } from '../components/refresh-control.js';

export class DashboardPage extends BaseComponent<DashboardPageState> {
  private refreshControl: RefreshControl | null = null;

  render(): void {
    this.root.innerHTML = `
      <div class="dashboard__toolbar">
        <div id="refresh-control-container"></div>
      </div>
    `;
  }

  private initializeComponents(): void {
    const container = this.query('#refresh-control-container');
    if (container) {
      this.refreshControl = new RefreshControl(container);
      this.refreshControl.mount();
    }
  }

  onDestroy(): void {
    this.refreshControl?.destroy();
  }
}
```

### Programmatic Control

You can also control the refresh frequency programmatically:

```typescript
import { setFrequency, getRefreshState } from '../state/refresh-state.js';

// Set refresh to 5 seconds
setFrequency(5000);

// Disable refresh
setFrequency('off');

// Get current state
const state = getRefreshState();
console.log(`Current frequency: ${state.frequency}`);
console.log(`Tick count: ${state.tick}`);
```

## Refresh Frequencies

Available options in the UI:

| Option | Value | Use Case |
|--------|-------|----------|
| Off | `'off'` | No automatic refresh |
| 5s | `5000` | Real-time monitoring |
| 15s | `15000` | Balanced monitoring (default recommended) |
| 30s | `30000` | Low-frequency updates |

## State Management

The RefreshManager maintains state using the `global-state` pattern:

```typescript
interface RefreshState {
  tick: number;        // Increments on each refresh
  frequency: RefreshFrequency; // Current interval or 'off'
}
```

Subscribers are notified whenever:
- The frequency changes
- A refresh tick occurs (timer fires)

## Implementation Details

### Timer Management

- Only one `setInterval` runs at a time
- Changing frequency stops the old timer and starts a new one
- Setting frequency to `'off'` clears the timer
- Timer restarts automatically when frequency changes

### Subscription Cleanup

The service integrates with `BaseComponent`'s subscription management:

```typescript
// In a widget
this.addSubscription(
  subscribeToRefresh((state) => {
    // This callback is automatically cleaned up when the widget is destroyed
  })
);
```

### Error Handling

- Errors in subscriber callbacks are caught and logged
- One failing subscriber doesn't affect others
- Widget refresh errors should be handled locally

## Testing

Comprehensive tests are available:

### Unit Tests

- **Refresh State** (`tests/unit/state/refresh-state.test.ts`)
  - Frequency changes
  - Timer management
  - Subscription lifecycle
  - Multiple subscribers

- **RefreshControl** (`tests/unit/components/refresh-control.test.ts`)
  - UI rendering
  - User interactions
  - State synchronization
  - Accessibility

### Integration Tests

- **Refresh Functionality** (`tests/integration/refresh-functionality.test.ts`)
  - End-to-end refresh flow
  - Widget integration
  - Multiple widget scenarios
  - Cleanup behavior

## Performance Considerations

- **Efficient Polling**: Only widgets that need updates subscribe
- **Single Timer**: One global timer prevents multiple intervals
- **Automatic Cleanup**: Destroyed widgets unsubscribe automatically
- **Configurable**: Users can disable or slow refresh to reduce load

## Future Enhancements

Potential improvements:

1. **Per-Widget Frequencies**: Allow individual widgets to have different refresh rates
2. **Smart Refresh**: Skip refresh when dashboard is not visible (Page Visibility API)
3. **Exponential Backoff**: Slow down refresh on repeated errors
4. **Manual Refresh Button**: Trigger immediate refresh on demand
5. **Custom Frequencies**: Allow users to input custom intervals
6. **Pause on Interaction**: Pause refresh when user is actively interacting

## Accessibility

The RefreshControl component follows WCAG 2.1 AA standards:

- Proper ARIA labels on the select dropdown (`aria-label="Select dashboard refresh frequency"`)
- Touch targets meet minimum 44px × 44px requirement
- Keyboard navigable (Tab, Arrow keys, Enter)
- Screen reader friendly with descriptive labels
- High-contrast focus indicators (2px outline with offset)
- Clear visual labels for all options
- Responsive design: label shown on desktop, compact on mobile
- Smooth hover and active state transitions

## Browser Compatibility

- Uses standard `setInterval` API (universal support)
- No browser-specific features required
- Works in all modern browsers

## Related Documentation

- [Component Architecture](../ARCHITECTURE.md#components)
- [State Management](../ARCHITECTURE.md#state-management)
- [Testing Strategy](../testing/TESTING_SUMMARY.md)
- [Agent States Widget](./agent-states-widget.md)

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history and updates.
