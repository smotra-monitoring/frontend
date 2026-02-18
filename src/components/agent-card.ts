/**
 * Agent card component
 * Individual Bento-Box agent card with status pulse and metrics
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { Agent, AgentStatus } from '../types/dashboard-types.js';
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
    
    this.root.innerHTML = `
      <article class="agent-card" data-status="${agent.status}">
        <div class="agent-card__header">
          <div class="agent-card__status">
            <span 
              class="status-pulse status-pulse--${agent.status}" 
              aria-label="${this.getStatusLabel(agent.status)}"
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
    const { metrics } = agent;
    
    if (!metrics) {
      return '<p class="has-text-grey">No metrics available</p>';
    }
    
    return `
      <div class="agent-card__metric">
        <span class="agent-card__metric-label">Latency</span>
        <span class="agent-card__metric-value ${this.getLatencyClass(metrics.latency)}">
          ${metrics.latency}ms
        </span>
      </div>
      
      ${metrics.uptime !== undefined ? `
        <div class="agent-card__metric">
          <span class="agent-card__metric-label">Uptime</span>
          <span class="agent-card__metric-value">
            ${this.formatUptime(metrics.uptime)}
          </span>
        </div>
      ` : ''}
      
      ${metrics.lastSeen ? `
        <div class="agent-card__metric">
          <span class="agent-card__metric-label">Last Seen</span>
          <span class="agent-card__metric-value">
            ${this.formatRelativeTime(metrics.lastSeen)}
          </span>
        </div>
      ` : ''}
    `;
  }
  
  private renderDetails(): string {
    const { agent } = this.state;
    
    return `
      <div class="agent-card__details">
        <dl class="agent-card__details-list">
          <dt>ID</dt>
          <dd><code>${this.escapeHtml(agent.id)}</code></dd>
          
          ${agent.hostname ? `
            <dt>Hostname</dt>
            <dd>${this.escapeHtml(agent.hostname)}</dd>
          ` : ''}
          
          ${agent.ipAddress ? `
            <dt>IP Address</dt>
            <dd>${this.escapeHtml(agent.ipAddress)}</dd>
          ` : ''}
          
          ${agent.version ? `
            <dt>Version</dt>
            <dd>${this.escapeHtml(agent.version)}</dd>
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
      warning: 'Warning',
      error: 'Error',
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
