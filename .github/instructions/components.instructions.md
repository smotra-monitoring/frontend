---
description: "Component architecture rules: BaseComponent pattern, lifecycle hooks, viewport-aware rendering, WebSocket integration, event listener management. Use when creating or modifying any TypeScript component or page class."
applyTo: "src/components/**, src/pages/**"
---

# Component Architecture

Components are implemented as **TypeScript classes** (not functions) inheriting from a base component class. This provides encapsulation, lifecycle management, and state handling without a framework.

## Base Component Pattern

```typescript
abstract class BaseComponent {
  protected root: HTMLElement;
  protected state: any;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  abstract render(): void;

  onMount?(): void;
  onUpdate?(prevState: any): void;
  onDestroy?(): void;

  setState(newState: Partial<any>): void {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.render();
    this.onUpdate?.(prevState);
  }
}
```

## Viewport-Aware Rendering

Components can access current viewport state (mobile/tablet/desktop/wide/ultrawide) to make intelligent rendering decisions. Use ResizeObserver to react to viewport changes.

## WebSocket Integration

Dashboard components subscribe to WebSocket events for real-time updates. Components update their DOM efficiently using targeted element updates rather than full re-renders.

## Event Handling

Components manage their own event listeners:
- Add listeners in `onMount()`
- Remove listeners in `onDestroy()` to prevent memory leaks
- Use event delegation where appropriate

## Example: Agent Card Component

```typescript
class AgentCard extends BaseComponent {
  private agent: Agent;

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
      this.setState({ agent: { ...this.agent, ...data } });
    });
  }
}
```
