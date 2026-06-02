/**
 * Agent card component
 * Individual Bento-Box agent card with status pulse and metrics
 * 
 * NOTE: This component is being superseded by AgentStatesWidget
 * (table-based view). Keeping for potential future use.
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { Agent, AgentStatus } from '../types/dashboard-types.js';
import { deriveAgentStatus } from '../utils/agent-utils.js';
import { on as onWebSocket } from '../services/websocket-service.js';

interface AgentCardState extends ComponentState {
  agent: Agent;
  expanded: boolean;
}

/**
 * Agent card component with Bento-Box styling
 */
export class AgentCard extends BaseComponent<AgentCardState> {
  constructor(root: HTMLElement, agent: Agent) {
    super(root, {
      agent,
      expanded: false,
    });

    // Subscribe to WebSocket updates for this agent
    this.addSubscription(
      onWebSocket(`agent:${agent.id}`, (message) => {
        if (message.payload) {
          this.updateAgent({ ...this.state.agent, ...message.payload });
        }
      })
    );
  }

  render(): void {
    const { agent, expanded } = this.state;
    const status = deriveAgentStatus(agent.lastSeenAt);

    this.root.innerHTML = `
      <article class="agent-card" data-status="${status}">
        <div class="agent-card__header">
          <div class="agent-card__status">
            <span 
              class="status-pulse status-pulse--${status}" 
              aria-label="${this.getStatusLabel(status)}"
            ></span>
            <h3 class="agent-card__name">${this.escapeHtml(agent.name)}</h3>
          </div>
          ${this.renderActions()}
        </div>
        
        <div class="agent-card__metrics">
          ${this.renderMetrics()}
        </div>
        
        ${expanded ? this.renderDetails() : ''}
      </article>
    `;

    // Attach event listeners
    this.attachEventListeners();
  }

  private renderActions(): string {
    return `
      <div class="agent-card__actions">
        <button 
          class="button is-small is-ghost" 
          data-action="toggle-details"
          aria-label="Toggle details"
          aria-expanded="${this.state.expanded}"
        >
          <span class="icon">
            <i class="fas fa-chevron-${this.state.expanded ? 'up' : 'down'}"></i>
          </span>
        </button>
      </div>
    `;
  }

  private renderMetrics(): string {
    const { agent } = this.state;

    return `
      ${agent.agentVersion ? `
        <div class="agent-card__metric">
          <span class="agent-card__metric-label">Agent Version</span>
          <span class="agent-card__metric-value">
            ${this.escapeHtml(agent.agentVersion)}
          </span>
        </div>
      ` : ''}
      
      ${agent.configVersion !== undefined && agent.configVersion !== null ? `
        <div class="agent-card__metric">
          <span class="agent-card__metric-label">Config Version</span>
          <span class="agent-card__metric-value">
            ${agent.configVersion}
          </span>
        </div>
      ` : ''}
      
      ${agent.lastSeenAt ? `
        <div class="agent-card__metric">
          <span class="agent-card__metric-label">Last Seen</span>
          <span class="agent-card__metric-value">
            ${this.formatRelativeTime(agent.lastSeenAt.getTime())}
          </span>
        </div>
      ` : ''}
    `;
  }

  private renderDetails(): string {
    const { agent } = this.state;
    const primaryIP = agent.ipAddresses?.[0];

    return `
      <div class="agent-card__details">
        <dl class="agent-card__details-list">
          <dt>ID</dt>
          <dd><code>${this.escapeHtml(agent.id)}</code></dd>
          
          ${agent.sectionId ? `
            <dt>Section ID</dt>
            <dd><code>${this.escapeHtml(agent.sectionId)}</code></dd>
          ` : ''}
          
          ${primaryIP ? `
            <dt>IP Address</dt>
            <dd>${this.escapeHtml(primaryIP.ip)} (${this.escapeHtml(primaryIP.iface)})</dd>
          ` : ''}
          
          ${agent.agentVersion ? `
            <dt>Agent Version</dt>
            <dd>${this.escapeHtml(agent.agentVersion)}</dd>
          ` : ''}
        </dl>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const toggleButton = this.query('[data-action="toggle-details"]');

    if (toggleButton) {
      this.addEventListener(toggleButton, 'click', () => {
        this.toggleDetails();
      });
    }
  }

  private toggleDetails(): void {
    this.setState({ expanded: !this.state.expanded });
  }

  /**
   * Update agent data (from WebSocket or parent)
   */
  updateAgent(agent: Agent): void {
    this.setState({ agent });
  }

  private getStatusLabel(status: AgentStatus): string {
    const labels: Record<AgentStatus, string> = {
      online: 'Online',
      offline: 'Offline',
      unknown: 'Unknown',
    };
    return labels[status] || 'Unknown';
  }

  private getLatencyClass(latency: number): string {
    if (latency < 50) return 'has-text-success';
    if (latency < 150) return 'has-text-warning';
    return 'has-text-danger';
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);

    if (days > 0) {
      return `${days}d ${hours}h`;
    }

    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  private formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
