/**
 * Dashboard grid container component
 * Widget layout shell for compact dashboard tiles (AgentsSummaryWidget, etc.)
 * Full-size views (e.g. the agents table) live on their own pages.
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import { AgentsSummaryWidget } from '../widgets/agents-summary.js';
import { getAgents } from '../state/agent-state.js';

interface DashboardGridState extends ComponentState {
  loading: boolean;
}

/**
 * Dashboard grid container with widget layout
 * Currently hosts a single AgentsSummaryWidget tile
 */
export class DashboardGrid extends BaseComponent<DashboardGridState> {
  private agentsSummaryWidget: AgentsSummaryWidget | null = null;

  constructor(root: HTMLElement) {
    super(root, {
      loading: false,
    });
  }

  render(): void {
    // Clear existing content
    this.root.innerHTML = '';
    this.root.className = 'dashboard-grid';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'dashboard-grid__widget';
    this.root.appendChild(widgetContainer);

    this.agentsSummaryWidget = new AgentsSummaryWidget(widgetContainer, getAgents());
    this.agentsSummaryWidget.mount();
  }

  onDestroy(): void {
    if (this.agentsSummaryWidget) {
      this.agentsSummaryWidget.destroy();
      this.agentsSummaryWidget = null;
    }
  }
}
