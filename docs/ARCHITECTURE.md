# Architecture Overview

This document describes the architecture, design patterns, and technical decisions behind Smotra Frontend.

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Architecture Layers](#architecture-layers)
- [Component System](#component-system)
- [State Management](#state-management)
- [Authentication Flow](#authentication-flow)
- [Routing](#routing)
- [Styling Strategy](#styling-strategy)
- [Performance Optimizations](#performance-optimizations)
- [Testing Strategy](#testing-strategy)

## Design Philosophy

### No Framework, Maximum Control

We deliberately chose **vanilla TypeScript** over frameworks (React, Vue, Angular) for several reasons:

1. **Minimal Bundle Size**: No framework overhead (~150KB vs. ~500KB+)
2. **Full Control**: Direct DOM manipulation without virtual DOM abstractions
3. **Learning Opportunity**: Understand web fundamentals deeply
4. **Performance**: Optimize exactly what we need, when we need it
5. **Simplicity**: No build complexity, just TypeScript compiler

### Mobile-First Responsive

The entire design starts from **320px mobile** and progressively enhances to **2560px+ ultra-wide** displays:

- CSS Grid with `auto-fit` automatically scales column count
- Full-width desktop layouts (no artificial constraints)
- Touch-first interactions with keyboard/mouse enhancements
- Fluid typography with `clamp()`

### Accessibility as Foundation

WCAG 2.1 AA compliance isn't an afterthought:

- Semantic HTML5 structure
- ARIA labels on all interactive elements
- Keyboard navigation for all features
- `prefers-reduced-motion` respected
- Minimum 44px touch targets

## Architecture Layers

```
┌─────────────────────────────────────────┐
│            Presentation Layer           │
│  (Pages, Components, CSS)               │
├─────────────────────────────────────────┤
│           Application Layer             │
│  (Router, Auth Guards, Services)        │
├─────────────────────────────────────────┤
│            State Layer                  │
│  (Global State, Auth, Agents, Theme)    │
├─────────────────────────────────────────┤
│           Infrastructure Layer          │
│  (API Client, WebSocket, Storage)       │
└─────────────────────────────────────────┘
```

### Presentation Layer

**Responsibilities**: Render UI, handle user interactions, display data

**Components**:
- Pages: Login, Dashboard, OAuth Callback
- Components: AgentCard, DashboardGrid, ThemeToggle, etc.
- CSS: Mobile-first stylesheets

**Patterns**:
- Class-based components extending `BaseComponent`
- Lifecycle hooks: `onMount()`, `onUpdate()`, `onDestroy()`
- Declarative rendering via `render()` method

### Application Layer

**Responsibilities**: Orchestrate business logic, coordinate layers

**Components**:
- Router: Client-side routing with history API
- Auth Guards: Route protection based on authentication
- Services: High-level APIs for auth, agents, WebSocket

**Patterns**:
- Service layer abstracts API details from components
- Guards separate authentication logic from routing
- Event-driven communication (pub/sub)

### State Layer

**Responsibilities**: Manage application state, notify subscribers

**Components**:
- Global State: Generic pub/sub state manager
- Auth State: Authentication status, user info, tokens
- Agent State: Agent data, filtering, updates
- Theme Manager: Theme detection, persistence, application
- Viewport State: Breakpoint tracking, responsive logic

**Patterns**:
- Pub/sub for reactive updates
- Immutable state updates (spread operator)
- Single source of truth per state module

### Infrastructure Layer

**Responsibilities**: External communication, persistence, APIs

**Components**:
- API Client: Generated from OpenAPI spec
- WebSocket Service: Real-time bidirectional communication
- Storage: Type-safe localStorage wrapper

**Patterns**:
- Generated client ensures type safety
- Storage wrapper prevents serialization errors
- WebSocket service manages connection lifecycle

## Component System

### BaseComponent Pattern

All components extend `BaseComponent`:

```typescript
abstract class BaseComponent {
  protected root: HTMLElement;
  protected state: ComponentState;
  
  constructor(root: HTMLElement) {
    this.root = root;
  }
  
  abstract render(): void;
  
  onMount?(): void;        // Setup (event listeners)
  onUpdate?(prev: any): void;  // React to changes
  onDestroy?(): void;      // Cleanup
  
  setState(newState: Partial<ComponentState>): void {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.render();
    this.onUpdate?.(prevState);
  }
}
```

### Why This Pattern?

1. **Lifecycle Hooks**: Explicit setup/teardown prevents memory leaks
2. **State Management**: Built-in reactive state updates
3. **Type Safety**: TypeScript ensures correct usage
4. **Familiar**: Similar to React class components (for easy onboarding)
5. **No Magic**: Clear, explicit control flow

### Example Component

```typescript
export class AgentCard extends BaseComponent {
  private agent: Agent;
  
  constructor(root: HTMLElement, agent: Agent) {
    super(root);
    this.agent = agent;
  }
  
  render(): void {
    this.root.innerHTML = `
      <article class="agent-card">
        <div class="agent-card__status">
          <span class="status-pulse status-pulse--${this.agent.status}"></span>
          <span>${this.agent.name}</span>
        </div>
        <div class="agent-card__metrics">
          <span>Latency: ${this.agent.latency}ms</span>
        </div>
      </article>
    `;
  }
  
  onMount(): void {
    // Subscribe to WebSocket updates for this agent
    websocket.on(`agent:${this.agent.id}`, (data) => {
      this.agent = { ...this.agent, ...data };
      this.render();
    });
  }
  
  onDestroy(): void {
    // Unsubscribe to prevent memory leaks
    websocket.off(`agent:${this.agent.id}`);
  }
}
```

## State Management

### Lightweight Pub/Sub System

Instead of Redux or MobX, we built a minimal pub/sub system:

```typescript
interface State<T> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(listener: (state: T) => void): () => void;
}

export function createState<T>(initial: T): State<T> {
  let state = initial;
  const listeners = new Set<(state: T) => void>();
  
  return {
    getState: () => state,
    setState: (partial) => {
      state = { ...state, ...partial };
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
```

### Why Custom State Management?

1. **Simplicity**: ~40 lines of code vs. thousands in Redux
2. **Performance**: Direct notifications, no middleware overhead
3. **Type Safety**: Full TypeScript support
4. **No Boilerplate**: No actions, reducers, selectors
5. **Sufficient**: Our app doesn't need time-travel debugging or dev tools

### State Modules

Each domain has its own state module:

- **auth-state.ts**: Authentication status, tokens, user profile
- **agent-state.ts**: Agent data, filtering, sorting
- **theme-manager.ts**: Theme preference, system detection
- **viewport-state.ts**: Current breakpoint, responsive logic

Modules are independent but can subscribe to each other when needed.

## Authentication Flow

### OAuth2 with PKCE

We implement OAuth2 with PKCE (Proof Key for Code Exchange) for enhanced security:

```
┌────────┐                               ┌──────────┐
│ Client │                               │ Provider │
└───┬────┘                               └────┬─────┘
    │                                         │
    │ 1. Generate code_verifier               │
    │    & code_challenge (SHA256)            │
    │                                         │
    │ 2. Redirect with code_challenge ───────>│
    │                                         │
    │<──────── 3. Redirect with code ─────────│
    │                                         │
    │ 4. Exchange code + code_verifier ──────>│
    │                                         │
    │<──── 5. Return access_token + refresh ──│
    │                                         │
```

### Why PKCE?

- **No Client Secret**: Secure for SPAs (can't store secrets)
- **Prevents Interception**: Code verifier proves authenticity
- **Industry Standard**: Recommended by OAuth 2.1 spec

### Token Management

Tokens are stored in localStorage with automatic refresh:

```typescript
interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;  // Timestamp
  user_info: UserInfo;
}
```

Token refresh is scheduled 5 minutes before expiration.

## Routing

### Client-Side Router

We built a minimal client-side router using the History API:

```typescript
interface Route {
  path: string;
  component: (root: HTMLElement) => void;
  requiresAuth?: boolean;
  allowedRoles?: string[];
}
```

### Route Protection

Auth guards run before rendering:

```typescript
async function canAccessRoute(route: Route): Promise<boolean> {
  if (!route.requiresAuth) return true;
  
  const authState = getAuthState();
  if (!authState.isAuthenticated) {
    navigateTo('/login');
    return false;
  }
  
  if (route.allowedRoles) {
    return await hasAnyRole(route.allowedRoles);
  }
  
  return true;
}
```

### Navigation

Navigation is smooth without full page reloads:

```typescript
export function navigateTo(path: string): void {
  window.history.pushState({}, '', path);
  renderCurrentRoute();
}
```

Links use `data-link` attribute to prevent default and use router:

```html
<a href="/dashboard" data-link>Dashboard</a>
```

## Styling Strategy

### CSS Architecture

We follow a **mobile-first, layered** approach:

```
base.css         → Reset, root styles, smooth scroll
variables.css    → CSS custom properties (colors, spacing)
theme-dark.css   → Dark mode overrides
theme-light.css  → Light mode overrides
layout.css       → Grid systems, flexbox layouts
components.css   → Component-specific styles
animations.css   → Keyframes, transitions
utilities.css    → Helper classes
```

### Why No CSS-in-JS?

1. **Performance**: No runtime overhead
2. **Caching**: CSS files cached by browser
3. **Simplicity**: Standard CSS tooling
4. **Separation**: Clear separation of concerns
5. **Debugging**: Browser dev tools work perfectly

### Responsive Grid

The dashboard uses CSS Grid with `auto-fit`:

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

This automatically scales from 1 column (mobile) to 6+ columns (ultra-wide) without media queries.

### Theme System

Themes are applied via CSS classes on `<html>`:

```css
/* variables.css */
:root {
  --color-bg: #ffffff;
  --color-text: #363636;
}

/* theme-dark.css */
.theme-dark {
  --color-bg: #0b0e14;
  --color-text: #e6e6e6;
}
```

This allows instant theme switching by changing a single class.

## Performance Optimizations

### CSS Containment

Agent cards use CSS containment for better scroll performance:

```css
.agent-card {
  contain: layout style;
}
```

This tells the browser that card layout doesn't affect siblings.

### Lazy Loading

Agent cards lazy load as they enter viewport using Intersection Observer:

```typescript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      renderAgentCard(entry.target);
      observer.unobserve(entry.target);
    }
  });
});
```

### Efficient Rendering

Components update only what changed, not full re-renders:

```typescript
onUpdate(prevState: ComponentState): void {
  if (prevState.status !== this.state.status) {
    // Update only status indicator, not entire card
    this.updateStatusIndicator();
  }
}
```

### Bundle Size

- TypeScript to ES modules (no bundler needed)
- Tree-shaking via native ES imports
- No framework overhead
- Target: <200KB gzipped

## Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │ Integration │  33 tests (E2E flows)
        └─────────────┘
      ┌───────────────────┐
      │   Component       │  42 tests (UI behavior)
      └───────────────────┘
    ┌───────────────────────┐
    │       Unit            │  100 tests (Pure functions)
    └───────────────────────┘
```

### Testing Principles

1. **Test Behavior, Not Implementation**: Test what users experience
2. **Mock External Dependencies**: Mock API, WebSocket, localStorage
3. **Responsive Testing**: Test at multiple viewports
4. **Accessibility Testing**: Verify ARIA labels, keyboard navigation
5. **High Coverage**: 80%+ overall, 90%+ for auth and utils

### Test Organization

```
tests/
├── unit/          # Pure functions, isolated modules
├── integration/   # Complete user flows
└── mocks/         # Shared test data
```

Each test file mirrors the `src/` structure for easy navigation.

## Design Decisions

### Why TypeScript?

- **Type Safety**: Catch errors at compile time
- **IDE Support**: Excellent autocomplete and refactoring
- **Documentation**: Types serve as inline documentation
- **Maintainability**: Easier to refactor with confidence

### Why Bulma CSS?

- **Utility-First**: Minimal custom CSS needed
- **Responsive**: Built-in responsive utilities
- **Lightweight**: Smaller than Bootstrap
- **Customizable**: Easy to override with CSS variables
- **No JavaScript**: Pure CSS framework

### Why Vitest?

- **Fast**: Native ESM support, parallel test execution
- **Modern**: Built for Vite, optimized for TypeScript
- **Complete**: Mocking, coverage, snapshots built-in
- **Compatible**: Jest-compatible API, easy migration
- **jsdom**: Browser environment simulation

### Why localStorage?

- **Persistence**: Survives browser restarts
- **Synchronous**: No async complexity
- **Simple API**: Easy to use and test
- **Browser Support**: Universal support

## Future Considerations

### Potential Improvements

- **Code Splitting**: Route-based lazy loading for larger apps
- **Service Workers**: Offline support with PWA
- **Virtual Scrolling**: For 1000+ agents
- **Web Workers**: Heavy computation off main thread
- **IndexedDB**: For large local data storage

### Scalability

Current architecture scales to:
- **Users**: Hundreds of concurrent users (server-dependent)
- **Agents**: Thousands of agents (with virtual scrolling)
- **Updates**: Real-time updates via WebSocket (server-dependent)
- **Features**: Modular architecture supports additions

---

**This architecture provides a solid foundation for a performant, maintainable, and scalable monitoring application.**

For implementation details, see the [Component API docs](./COMPONENT_API.md) and [State Management guide](./STATE_MANAGEMENT.md).
