/**
 * Agent States Widget Component
 * 
 * A self-contained table widget displaying agent states with sortable columns
 * and a row highlight for the agent shown in the details side panel.
 * 
 * Key Features:
 * - Table layout with sortable headers (Name, Status, Last Seen)
 * - Row click opens the agent details side panel; the Desired version button also expands its config preview
 * - Status derived from lastSeenAt using AGENT_ONLINE_THRESHOLD_MS
 * - Real-time updates via agent state subscription
 */

import { BaseComponent } from '../components/base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { Agent, SortOptions, AgentStatus, SortField } from '../types/agent-types.js';
import { subscribeToAgents, sortAgents, loadAgents } from '../state/agent-state.js';
import { deriveAgentStatus, formatLastSeen } from '../utils/agent-utils.js';
import { subscribeToRefresh } from '../state/refresh-state.js';
import { getAgentDetailsPanelState, openAgentDetails, subscribeToAgentDetailsPanel } from '../state/agent-details-panel-state.js';
import { SIDE_PANEL_ID } from '../components/side-panel.js';
import { escapeHtml } from '../utils/dom-helpers.js';

interface AgentStatesWidgetState extends ComponentState {
  agents: Agent[];
  loading: boolean;
  sort: SortOptions;
}

/**
 * AgentStatesWidget - Table-based agent list that opens a details side panel
 */
export class AgentStatesWidget extends BaseComponent<AgentStatesWidgetState> {
  constructor(root: HTMLElement, agents: Agent[] = []) {
    super(root, {
      agents,
      loading: false,
      sort: { field: 'name', direction: 'asc' },
    });

    // Subscribe to agent state updates
    this.addSubscription(
      subscribeToAgents((agentState) => {
        this.setState({ agents: agentState.agents, loading: false });
      })
    );

    // Subscribe to the refresh manager to poll for new data
    this.addSubscription(
      subscribeToRefresh(() => {
        this.setLoading(true);
        loadAgents().catch(error => {
          console.error('Failed to refresh agent data:', error);
          this.setLoading(false);
        });
      })
    );

    // Update the selected row in place so focus and scroll position survive
    this.addSubscription(
      subscribeToAgentDetailsPanel((panelState) => this.updateSelection(panelState.agentId))
    );
  }

  render(): void {
    const { agents, loading, sort } = this.state;
    const sortedAgents = sortAgents(agents, sort);

    this.root.innerHTML = `
      <section class="agent-states-widget">
        <div class="agent-states-widget__header">
          <div class="agent-states-widget__title">
            <h2>Agent States</h2>
            <span class="agent-states-widget__count" aria-label="Total agents">
              ${agents.length}
            </span>
          </div>
        </div>

        ${loading ? this.renderLoading() : this.renderTable(sortedAgents)}
      </section>
    `;

    this.attachEventListeners();
  }

  private renderLoading(): string {
    return `
      <div class="agent-states-widget__loading">
        <p>Loading agents...</p>
      </div>
    `;
  }

  private renderTable(agents: Agent[]): string {
    if (agents.length === 0) {
      return `
        <div class="agent-states-widget__empty">
          <p>No agents found</p>
        </div>
      `;
    }

    const { sort } = this.state;

    return `
      <table class="agent-states-table">
        <thead>
          <tr>
            <th style="width: 25%">
              <button 
                class="sort-btn" 
                data-sort-field="name"
                aria-sort="${this.getSortAriaAttribute('name')}"
              >
                Name
                ${this.renderSortIndicator('name')}
              </button>
            </th>
            <th style="width: 15%">
              <button 
                class="sort-btn" 
                data-sort-field="status"
                aria-sort="${this.getSortAriaAttribute('status')}"
              >
                Status
                ${this.renderSortIndicator('status')}
              </button>
            </th>
            <th style="width: 15%">
              <button 
                class="sort-btn" 
                data-sort-field="agentVersion"
                aria-sort="${this.getSortAriaAttribute('agentVersion')}"
              >
                Agent Version
                ${this.renderSortIndicator('agentVersion')}
              </button>
            </th>
            <th style="width: 15%">
              <div class="sort-btn-group">
                <button 
                  class="sort-btn" 
                  data-sort-field="configVersionCurrent"
                  aria-sort="${this.getSortAriaAttribute('configVersionCurrent')}"
                >
                  Config Current
                  ${this.renderSortIndicator('configVersionCurrent')}
                </button>
                <span aria-hidden="true">/</span>
                <button 
                  class="sort-btn" 
                  data-sort-field="configVersionDesired"
                  aria-sort="${this.getSortAriaAttribute('configVersionDesired')}"
                >
                  Desired
                  ${this.renderSortIndicator('configVersionDesired')}
                </button>
              </div>
            </th>
            <th style="width: 20%">
              <button 
                class="sort-btn" 
                data-sort-field="lastSeenAt"
                aria-sort="${this.getSortAriaAttribute('lastSeenAt')}"
              >
                Last Seen
                ${this.renderSortIndicator('lastSeenAt')}
              </button>
            </th>
            <th style="width: 10%">
              <span class="is-sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          ${agents.map(agent => this.renderAgentRow(agent)).join('')}
        </tbody>
      </table>
    `;
  }

  private renderAgentRow(agent: Agent): string {
    const status = deriveAgentStatus(agent.last_seen_at);
    const selected = getAgentDetailsPanelState().agentId === agent.id;
    const agentId = escapeHtml(agent.id);
    const agentName = escapeHtml(agent.name);

    return `
      <tr
        class="agent-states-row${selected ? ' agent-states-row--selected' : ''}"
        data-agent-row
        data-agent-id="${agentId}"
        ${selected ? 'aria-current="true"' : ''}
      >
        <td class="agent-states-row__name">
          ${escapeHtml(agent.name)}
        </td>
        <td class="agent-states-row__status">
          ${this.renderStatusBadge(status)}
        </td>
        <td class="agent-states-row__agent-version">
          ${agent.agent_version ? escapeHtml(agent.agent_version) : 'Unknown'}
        </td>
        <td class="agent-states-row__config-version">
          ${agent.config_version_current ?? 'N/A'} /
          <button
            type="button"
            class="config-version-btn"
            data-action="show-config"
            data-agent-id="${agentId}"
            aria-label="Show desired configuration, version ${agent.config_version_desired}, for ${agentName}"
          >${agent.config_version_desired}</button>
        </td>
        <td class="agent-states-row__last-seen">
          ${agent.last_seen_at ? formatLastSeen(agent.last_seen_at) : 'Never'}
        </td>
        <td class="agent-states-row__actions">
          <button
            type="button"
            class="button is-small is-ghost chevron-btn"
            data-action="toggle-details"
            data-agent-id="${agentId}"
            aria-expanded="${selected}"
            aria-controls="${SIDE_PANEL_ID}"
            aria-label="Show details for ${agentName}"
          >
            <span class="icon">
              <i class="fas fa-chevron-right" aria-hidden="true"></i>
            </span>
          </button>
        </td>
      </tr>
    `;
  }

  private renderStatusBadge(status: AgentStatus): string {
    const statusClass = `agent-status-badge agent-status-badge--${status}`;
    const statusLabel = this.getStatusLabel(status);

    return `
      <span class="${statusClass}" role="status" aria-label="${statusLabel}">
        <span class="status-pulse status-pulse--${status}"></span>
        <span class="status-label">${statusLabel}</span>
      </span>
    `;
  }

  private renderSortIndicator(field: string): string {
    const { sort } = this.state;
    if (sort.field !== field) {
      return '<span class="sort-indicator sort-indicator--inactive"></span>';
    }

    const icon = sort.direction === 'asc' ? 'fa-chevron-up' : 'fa-chevron-down';
    return `
      <span class="sort-indicator sort-indicator--active">
        <i class="fas ${icon}"></i>
      </span>
    `;
  }

  private getSortAriaAttribute(field: string): string {
    const { sort } = this.state;
    if (sort.field !== field) {
      return 'none';
    }
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  private attachEventListeners(): void {
    // Sort button handlers
    const sortButtons = this.root.querySelectorAll<HTMLButtonElement>('.sort-btn');
    sortButtons.forEach(button => {
      this.addEventListener(button, 'click', () => {
        const field = button.dataset.sortField as SortField;
        if (field) {
          this.handleSort(field);
        }
      });
    });

    // One delegated listener: keyboard activation of the buttons bubbles here as a click too.
    this.addEventListener(this.root, 'click', (event) => {
      this.handleRowClick(event.target as Element);
    });
  }

  private handleRowClick(target: Element): void {
    const agentId = target.closest<HTMLElement>('[data-agent-row]')?.dataset.agentId;
    if (!agentId) return;

    const wantsConfig = target.closest('[data-action="show-config"]') !== null;
    openAgentDetails(agentId, { expandConfig: wantsConfig });
  }

  private updateSelection(selectedAgentId: string | null): void {
    this.root.querySelectorAll<HTMLElement>('[data-agent-row]').forEach(row => {
      const selected = row.dataset.agentId === selectedAgentId;
      row.classList.toggle('agent-states-row--selected', selected);
      if (selected) {
        row.setAttribute('aria-current', 'true');
      } else {
        row.removeAttribute('aria-current');
      }
      row.querySelector('[data-action="toggle-details"]')?.setAttribute('aria-expanded', String(selected));
    });
  }

  private handleSort(field: SortField): void {
    const { sort } = this.state;
    const newDirection = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';

    this.setState({
      sort: { field, direction: newDirection },
    });
  }

  private getStatusLabel(status: AgentStatus): string {
    const labels: Record<AgentStatus, string> = {
      online: 'Online',
      offline: 'Offline',
      unknown: 'Unknown',
    };
    return labels[status];
  }

  /**
   * Update the loading state
   */
  public setLoading(loading: boolean): void {
    this.setState({ loading });
  }
}
