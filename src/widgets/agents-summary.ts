/**
 * Agents Summary Widget
 *
 * Compact dashboard tile showing "online / total" agents.
 * The whole tile is a link to the full agents list (`/agent`).
 */

import { BaseComponent } from '../components/base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { Agent } from '../types/agent-types.js';
import { subscribeToAgents, loadAgents } from '../state/agent-state.js';
import { subscribeToRefresh } from '../state/refresh-state.js';
import { deriveAgentStatus } from '../utils/agent-utils.js';
import { navigateTo } from '../utils/navigation.js';

export const AGENTS_ROUTE = '/agent';

type Health = 'ok' | 'degraded' | 'down' | 'empty';

interface AgentsSummaryState extends ComponentState {
  agents: Agent[];
}

export class AgentsSummaryWidget extends BaseComponent<AgentsSummaryState> {
  constructor(root: HTMLElement, agents: Agent[] = []) {
    super(root, { agents });

    this.addSubscription(
      subscribeToAgents((agentState) => {
        this.setState({ agents: agentState.agents });
      })
    );

    this.addSubscription(
      subscribeToRefresh(() => {
        loadAgents().catch(error => {
          console.error('Failed to refresh agent data:', error);
        });
      })
    );
  }

  render(): void {
    const { agents } = this.state;
    const total = agents.length;
    const online = agents.filter(a => deriveAgentStatus(a.lastSeenAt) === 'online').length;
    const health = this.getHealth(online, total);
    const caption = this.getCaption(online, total);

    this.root.innerHTML = `
      <a
        class="agents-summary agents-summary--${health}"
        href="${AGENTS_ROUTE}"
        aria-label="Agents: ${online} of ${total} online. ${caption}. Open agents list"
      >
        <span class="agents-summary__label">
          <span class="status-pulse agents-summary__pulse agents-summary__pulse--${health}" aria-hidden="true"></span>
          Agents
        </span>
        <span class="agents-summary__value" aria-hidden="true">
          <span class="agents-summary__online">${online}</span><span class="agents-summary__total">/${total}</span>
        </span>
        <span class="agents-summary__caption" aria-hidden="true">${caption}</span>
        <span class="agents-summary__chevron" aria-hidden="true"><i class="fas fa-chevron-right"></i></span>
      </a>
    `;

    const link = this.root.querySelector<HTMLAnchorElement>('.agents-summary');
    if (link) {
      this.addEventListener(link, 'click', (e) => {
        e.preventDefault();
        void navigateTo(AGENTS_ROUTE, 'push');
      });
    }
  }

  private getHealth(online: number, total: number): Health {
    if (total === 0) return 'empty';
    if (online === total) return 'ok';
    if (online === 0) return 'down';
    return 'degraded';
  }

  private getCaption(online: number, total: number): string {
    if (total === 0) return 'No agents';
    if (online === total) return 'All online';
    return `${total - online} offline`;
  }
}
