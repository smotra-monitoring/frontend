/**
 * Agent States Widget Component
 * 
 * A self-contained table widget displaying agent states with sortable columns
 * and CSS-only expandable rows for detailed information.
 * 
 * Key Features:
 * - Table layout with sortable headers (Name, Status, Last Seen)
 * - CSS-only expand/collapse (no re-renders, smooth transitions)
 * - Status derived from lastSeenAt using AGENT_ONLINE_THRESHOLD_MS
 * - "Toggle All" button to expand/collapse all rows
 * - Real-time updates via agent state subscription
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { Agent, SortOptions, AgentStatus, SortField } from '../types/dashboard-types.js';
import { subscribeToAgents, sortAgents } from '../state/agent-state.js';
import { deriveAgentStatus, formatLastSeen, formatAbsoluteDate } from '../utils/agent-utils.js';

interface AgentStatesWidgetState extends ComponentState {
    agents: Agent[];
    loading: boolean;
    sort: SortOptions;
}

/**
 * AgentStatesWidget - Table-based agent list with expandable details
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
          <button 
            class="button is-small" 
            data-action="toggle-all"
            aria-label="Toggle all agent details"
          >
            <span class="icon">
              <i class="fas fa-chevron-down"></i>
            </span>
            <span>Toggle All</span>
          </button>
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
            <th style="width: 40%">
              <button 
                class="sort-btn" 
                data-sort-field="name"
                aria-sort="${this.getSortAriaAttribute('name')}"
              >
                Name
                ${this.renderSortIndicator('name')}
              </button>
            </th>
            <th style="width: 20%">
              <button 
                class="sort-btn" 
                data-sort-field="status"
                aria-sort="${this.getSortAriaAttribute('status')}"
              >
                Status
                ${this.renderSortIndicator('status')}
              </button>
            </th>
            <th style="width: 30%">
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
        const status = deriveAgentStatus(agent.lastSeenAt);
        const rowId = `agent-row-${agent.id}`;
        const detailsId = `agent-details-${agent.id}`;

        return `
      <tr class="agent-states-row" data-agent-id="${agent.id}">
        <td class="agent-states-row__name">
          ${this.escapeHtml(agent.name)}
        </td>
        <td class="agent-states-row__status">
          ${this.renderStatusBadge(status)}
        </td>
        <td class="agent-states-row__last-seen">
          ${agent.lastSeenAt ? formatLastSeen(agent.lastSeenAt) : 'Never'}
        </td>
        <td class="agent-states-row__actions">
          <button 
            class="button is-small is-ghost chevron-btn" 
            data-action="toggle-details"
            data-agent-id="${agent.id}"
            aria-expanded="false"
            aria-controls="${detailsId}"
            aria-label="Toggle details for ${this.escapeHtml(agent.name)}"
          >
            <span class="icon">
              <i class="fas fa-chevron-down"></i>
            </span>
          </button>
        </td>
      </tr>
      <tr 
        class="agent-states-row__details" 
        id="${detailsId}"
        aria-hidden="true"
        data-agent-id="${agent.id}"
      >
        <td colspan="4">
          ${this.renderAgentDetails(agent)}
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

    private renderAgentDetails(agent: Agent): string {
        const primaryIP = agent.ipAddresses?.find(ip => ip.recommended) || agent.ipAddresses?.[0];
        const allIPs = agent.ipAddresses || [];

        return `
      <div class="agent-details">
        <dl class="agent-details__grid">
          <div class="agent-details__item">
            <dt>Agent ID</dt>
            <dd><code>${this.escapeHtml(agent.id)}</code></dd>
          </div>

          ${agent.sectionId ? `
            <div class="agent-details__item">
              <dt>Section ID</dt>
              <dd><code>${this.escapeHtml(agent.sectionId)}</code></dd>
            </div>
          ` : ''}

          ${agent.agentVersion ? `
            <div class="agent-details__item">
              <dt>Agent Version</dt>
              <dd>${this.escapeHtml(agent.agentVersion)}</dd>
            </div>
          ` : ''}

          ${agent.configVersion !== undefined && agent.configVersion !== null ? `
            <div class="agent-details__item">
              <dt>Config Version</dt>
              <dd>${agent.configVersion}</dd>
            </div>
          ` : ''}

          ${allIPs.length > 0 ? `
            <div class="agent-details__item agent-details__item--full">
              <dt>IP Addresses</dt>
              <dd>
                <ul class="agent-details__ip-list">
                  ${allIPs.map(ip => `
                    <li>
                      <code>${this.escapeHtml(ip.ip)}</code>
                      <span class="has-text-grey"> (${this.escapeHtml(ip.iface || 'unknown')}${ip.recommended ? ', recommended' : ''})</span>
                    </li>
                  `).join('')}
                </ul>
              </dd>
            </div>
          ` : ''}

          ${agent.lastResultSubmittedAt ? `
            <div class="agent-details__item">
              <dt>Last Result Submitted</dt>
              <dd>${formatAbsoluteDate(agent.lastResultSubmittedAt)}</dd>
            </div>
          ` : ''}

          ${agent.lastSeenAt ? `
            <div class="agent-details__item">
              <dt>Last Seen (Absolute)</dt>
              <dd>${formatAbsoluteDate(agent.lastSeenAt)}</dd>
            </div>
          ` : ''}

          ${agent.createdAt ? `
            <div class="agent-details__item">
              <dt>Created</dt>
              <dd>${formatAbsoluteDate(agent.createdAt)}</dd>
            </div>
          ` : ''}

          ${agent.updatedAt ? `
            <div class="agent-details__item">
              <dt>Updated</dt>
              <dd>${formatAbsoluteDate(agent.updatedAt)}</dd>
            </div>
          ` : ''}
        </dl>
      </div>
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

        // Toggle details handlers (CSS-only, no setState)
        const chevronButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-action="toggle-details"]');
        chevronButtons.forEach(button => {
            this.addEventListener(button, 'click', () => {
                const agentId = button.dataset.agentId;
                if (agentId) {
                    this.toggleAgentDetails(agentId, button);
                }
            });
        });

        // Toggle all handler (CSS-only, no setState)
        const toggleAllButton = this.root.querySelector<HTMLButtonElement>('[data-action="toggle-all"]');
        if (toggleAllButton) {
            this.addEventListener(toggleAllButton, 'click', () => {
                this.toggleAllDetails();
            });
        }
    }

    private handleSort(field: SortField): void {
        const { sort } = this.state;
        const newDirection = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';

        this.setState({
            sort: { field, direction: newDirection },
        });
    }

    /**
     * Toggle a single agent's detail row (CSS-only, no setState)
     * This uses direct DOM manipulation to preserve the element and enable smooth CSS transitions
     */
    private toggleAgentDetails(agentId: string, button: HTMLButtonElement): void {
        const detailsRow = this.root.querySelector<HTMLTableRowElement>(
            `.agent-states-row__details[data-agent-id="${agentId}"]`
        );

        if (!detailsRow) return;

        const wasExpanded = detailsRow.classList.contains('is-expanded');
        const chevronIcon = button.querySelector<HTMLElement>('.fa-chevron-down, .fa-chevron-up');

        // Toggle classes and ARIA attributes (no setState to avoid re-render)
        detailsRow.classList.toggle('is-expanded');
        button.setAttribute('aria-expanded', wasExpanded ? 'false' : 'true');
        detailsRow.setAttribute('aria-hidden', wasExpanded ? 'true' : 'false');

        // Update chevron icon
        if (chevronIcon) {
            chevronIcon.classList.toggle('fa-chevron-down', wasExpanded);
            chevronIcon.classList.toggle('fa-chevron-up', !wasExpanded);
        }
    }

    /**
     * Toggle all detail rows at once (CSS-only, no setState)
     * If any row is collapsed, expand all. If all are expanded, collapse all.
     */
    private toggleAllDetails(): void {
        const allDetailsRows = this.root.querySelectorAll<HTMLTableRowElement>('.agent-states-row__details');
        const allChevronButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-action="toggle-details"]');

        if (allDetailsRows.length === 0) return;

        // Check if any row is collapsed
        const anyCollapsed = Array.from(allDetailsRows).some(row => !row.classList.contains('is-expanded'));
        const shouldExpand = anyCollapsed;

        // Toggle all rows
        allDetailsRows.forEach((row, index) => {
            const button = allChevronButtons[index];
            const chevronIcon = button?.querySelector<HTMLElement>('.fa-chevron-down, .fa-chevron-up');

            if (shouldExpand) {
                row.classList.add('is-expanded');
                row.setAttribute('aria-hidden', 'false');
                button?.setAttribute('aria-expanded', 'true');
                chevronIcon?.classList.remove('fa-chevron-down');
                chevronIcon?.classList.add('fa-chevron-up');
            } else {
                row.classList.remove('is-expanded');
                row.setAttribute('aria-hidden', 'true');
                button?.setAttribute('aria-expanded', 'false');
                chevronIcon?.classList.remove('fa-chevron-up');
                chevronIcon?.classList.add('fa-chevron-down');
            }
        });

        // Update "Toggle All" button icon
        const toggleAllButton = this.root.querySelector<HTMLButtonElement>('[data-action="toggle-all"]');
        const toggleAllIcon = toggleAllButton?.querySelector<HTMLElement>('.fa-chevron-down, .fa-chevron-up');
        if (toggleAllIcon) {
            toggleAllIcon.classList.toggle('fa-chevron-down', !shouldExpand);
            toggleAllIcon.classList.toggle('fa-chevron-up', shouldExpand);
        }
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

    /**
     * Escape HTML to prevent XSS attacks
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
