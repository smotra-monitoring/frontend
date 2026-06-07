/**
 * Dashboard grid container component
 * Widget layout shell for dashboard widgets (AgentStatesWidget, etc.)
 * 
 * Refactored from agent-card factory to generic widget layout container.
 * Now mounts self-contained widgets like AgentStatesWidget instead of
 * creating individual agent cards.
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import { AgentStatesWidget } from './agent-states-widget.js';
import { getAgents } from '../state/agent-state.js';

interface DashboardGridState extends ComponentState {
  loading: boolean;
}

/**
 * Dashboard grid container with widget layout
 * Currently hosts a single full-width AgentStatesWidget
 */
export class DashboardGrid extends BaseComponent<DashboardGridState> {
  private agentStatesWidget: AgentStatesWidget | null = null;

  constructor(root: HTMLElement) {
    super(root, {
      loading: false,
    });
  }

  render(): void {
    // Clear existing content
    this.root.innerHTML = '';
    this.root.className = 'dashboard-grid';

    // Set CSS Grid properties (preserved for future multi-widget scenarios)
    this.root.style.display = 'grid';
    this.root.style.gridTemplateColumns = `repeat(auto-fit, minmax(300px, 1fr))`;
    this.root.style.gap = '1.5rem';

    // Create single full-width widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'dashboard-grid__widget dashboard-grid__widget--full';
    widgetContainer.style.gridColumn = '1 / -1'; // Full width
    this.root.appendChild(widgetContainer);

    // Mount AgentStatesWidget
    const agents = getAgents();
    this.agentStatesWidget = new AgentStatesWidget(widgetContainer, agents);
    this.agentStatesWidget.mount();
  }

  onDestroy(): void {
    // Clean up widget
    if (this.agentStatesWidget) {
      this.agentStatesWidget.destroy();
      this.agentStatesWidget = null;
    }
  }
}
