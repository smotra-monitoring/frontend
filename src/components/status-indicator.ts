/**
 * Status indicator component
 * Pulsing status dot with accessibility
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { AgentStatus } from '../types/dashboard-types.js';

interface StatusIndicatorState extends ComponentState {
  status: AgentStatus;
  pulsing: boolean;
}

/**
 * Status indicator with pulse animation
 */
export class StatusIndicator extends BaseComponent<StatusIndicatorState> {
  constructor(root: HTMLElement, status: AgentStatus, pulsing: boolean = true) {
    super(root, {
      status,
      pulsing,
    });
  }
  
  render(): void {
    const { status, pulsing } = this.state;
    
    this.root.innerHTML = `
      <span 
        class="status-indicator status-indicator--${status} ${pulsing ? 'status-indicator--pulsing' : ''}"
        role="img"
        aria-label="${this.getStatusLabel(status)}"
        title="${this.getStatusLabel(status)}"
      ></span>
    `;
  }
  
  /**
   * Update status
   */
  updateStatus(status: AgentStatus, pulsing?: boolean): void {
    this.setState({
      status,
      ...(pulsing !== undefined && { pulsing }),
    });
  }
  
  private getStatusLabel(status: AgentStatus): string {
    const labels: Record<AgentStatus, string> = {
      online: 'Online - Agent is reachable',
      offline: 'Offline - Agent is not reachable',
      warning: 'Warning - Agent experiencing issues',
      error: 'Error - Agent has critical issues',
      unknown: 'Unknown - Agent status unavailable',
    };
    return labels[status] || 'Unknown status';
  }
}
