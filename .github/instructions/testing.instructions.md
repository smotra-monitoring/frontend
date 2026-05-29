---
description: "Testing rules and requirements: Vitest setup, test organization, unit and integration test requirements for new features and bug fixes, coverage goals, mocking patterns. Use when writing tests or adding new features/fixing bugs."
applyTo: "tests/**, vitest.config.js"
---

# Testing

The project uses **Vitest** for unit and integration testing with **jsdom** for DOM mocking.

## Testing Principles

- **Unit tests** for all functions, components, utilities, and services
- **Integration tests** for complete flows (OAuth, WebSocket updates, routing)
- **Responsive tests** at multiple viewports (375px, 768px, 1280px, 1440px, 1920px, 2560px)
- **Accessibility tests** for keyboard navigation, ARIA labels, reduced motion
- **Component tests** focus on behavior, not implementation (user interactions, state changes)
- **Mock external dependencies** (WebSocket, fetch, localStorage, matchMedia)
- Test files mirror `src/` structure in `tests/` directory
- Aim for **80%+ code coverage**

## Test Organization

```
tests/
├── unit/
│   ├── auth/          # PKCE generation, token refresh, storage
│   ├── state/         # Theme detection, viewport tracking
│   ├── components/    # Render, events, accessibility
│   ├── services/      # API calls, WebSocket
│   └── utils/         # Pure function tests
├── integration/
│   ├── oauth-flow.test.ts         # End-to-end OAuth
│   ├── websocket-updates.test.ts  # Real-time dashboard updates
│   └── responsive/
│       ├── layout.test.ts         # Grid column counts at breakpoints
│       ├── navigation.test.ts     # Hamburger/sidebar switching
│       └── touch.test.ts          # Touch interactions
├── mocks/
│   ├── agent-data.ts
│   ├── oauth-responses.ts
│   ├── websocket-messages.ts
│   ├── user-data.ts
│   └── viewport-mocks.ts
└── setup.ts
```

## Test Requirements

**New features MUST include:**
- Unit tests covering all new functions, classes, utilities, and components (`tests/unit/`).
- At least one integration test covering the primary end-to-end flow of the feature (`tests/integration/`).
- A feature is not complete until its tests exist and pass.

**Bug fixes MUST include:**
- A regression test (unit or integration) that reproduces the bug and confirms it is fixed. This prevents the same bug from reappearing.

## Component Testing Example

```typescript
describe('AgentCard', () => {
  it('renders agent name and status', () => {
    const card = new AgentCard(mockAgent);
    expect(card.root.textContent).toContain(mockAgent.name);
    expect(card.root.querySelector('.status-pulse')).toBeInTheDocument();
  });

  it('updates on WebSocket message', () => {
    const card = new AgentCard(mockAgent);
    websocket.emit('agent:123', { latency: 50 });
    expect(card.root.textContent).toContain('50ms');
  });

  it('has accessible status indicator', () => {
    const card = new AgentCard(mockAgent);
    const status = card.root.querySelector('.status-pulse');
    expect(status).toHaveAttribute('aria-label');
  });
});
```

## Responsive Testing Example

```typescript
describe('Dashboard Grid', () => {
  it('shows 1 column on mobile (375px)', () => {
    mockViewport(375, 667);
    const grid = new DashboardGrid();
    expect(getComputedColumns(grid.root)).toBe(1);
  });

  it('shows 3-4 columns on desktop (1280px)', () => {
    mockViewport(1280, 800);
    const grid = new DashboardGrid();
    const cols = getComputedColumns(grid.root);
    expect(cols).toBeGreaterThanOrEqual(3);
    expect(cols).toBeLessThanOrEqual(4);
  });

  it('shows 5-6 columns on ultra-wide (1920px)', () => {
    mockViewport(1920, 1080);
    const grid = new DashboardGrid();
    const cols = getComputedColumns(grid.root);
    expect(cols).toBeGreaterThanOrEqual(5);
  });
});
```

## Testing Checklist

- [ ] Unit tests for OAuth PKCE generation and validation
- [ ] Unit tests for token refresh logic
- [ ] Unit tests for theme detection (system preference)
- [ ] Unit tests for viewport breakpoint detection
- [ ] Component tests for all UI components
- [ ] Integration test for complete OAuth login flow
- [ ] Integration test for WebSocket updates triggering UI changes
- [ ] Responsive tests at all breakpoints
- [ ] Accessibility tests for keyboard navigation
- [ ] Test smooth scroll is disabled with `prefers-reduced-motion`
- [ ] Test touch target sizes are 44px+ on mobile
- [ ] Test theme toggle updates CSS class on HTML element
- [ ] Mock fetch for API calls
- [ ] Mock WebSocket for real-time updates
- [ ] Mock localStorage for token storage
- [ ] Mock matchMedia for theme/viewport detection

## Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for TDD
npm run test:coverage # Coverage report
```

## Coverage Goals

- Overall: 80%+
- Auth module: 90%+ (security-critical)
- Components: 80%+
- Utilities: 90%+ (pure functions, easy to test)
- Services: 80%+
