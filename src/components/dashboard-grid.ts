/**
 * Dashboard grid container component
 * Auto-fit Bento-Box layout with lazy loading
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { Agent } from '../types/dashboard-types.js';
import { AgentCard } from './agent-card.js';
import { subscribeToAgents } from '../state/agent-state.js';
import { getOptimalColumns } from '../utils/viewport-utils.js';

interface DashboardGridState extends ComponentState {
  agents: Agent[];
  loading: boolean;
}

/**
 * Dashboard grid container with auto-fit Bento-Box layout
 */
export class DashboardGrid extends BaseComponent<DashboardGridState> {
  private agentCards: Map<string, AgentCard> = new Map();
  private intersectionObserver: IntersectionObserver | null = null;

  constructor(root: HTMLElement) {
    super(root, {
      agents: [],
      loading: true,
    });

    // Subscribe to agent updates
    this.addSubscription(
      subscribeToAgents((agentState) => {
        this.setState({
          agents: agentState.agents,
          loading: agentState.loading,
        });
      })
    );
  }

  render(): void {
    // Calculate optimal column count
    const columns = getOptimalColumns();

    // Clear existing content
    this.root.innerHTML = '';
    this.root.className = 'dashboard-grid';

    // Set CSS Grid properties
    this.root.style.display = 'grid';
    this.root.style.gridTemplateColumns = `repeat(auto-fit, minmax(300px, 1fr))`;
    this.root.style.gap = '1.5rem';

    if (this.state.loading && this.state.agents.length === 0) {
      this.renderLoading();
      return;
    }

    if (this.state.agents.length === 0) {
      this.renderEmpty();
      return;
    }

    // Render agent cards
    this.renderAgentCards();
  }

  private renderLoading(): void {
    this.root.innerHTML = `
      <div class="dashboard-grid__loading">
        <div class="loading-spinner"></div>
        <p>Loading agents...</p>
      </div>
    `;
  }

  private renderEmpty(): void {
    this.root.innerHTML = `
      <div class="dashboard-grid__empty">
        <p>No agents found</p>
        <p class="has-text-grey">Install agents on your hosts to start monitoring</p>
      </div>
    `;
  }

  private renderAgentCards(): void {
    const currentCardIds = new Set<string>();

    this.state.agents.forEach(agent => {
      currentCardIds.add(agent.id);

      // Check if card already exists
      if (this.agentCards.has(agent.id)) {
        const card = this.agentCards.get(agent.id)!;
        card.updateAgent(agent);
      } else {
        // Create new card
        const cardElement = document.createElement('article');
        cardElement.className = 'agent-card-container';
        cardElement.dataset.agentId = agent.id;
        this.root.appendChild(cardElement);

        const card = new AgentCard(cardElement, agent);
        this.agentCards.set(agent.id, card);
        card.mount();

        // Lazy load if observer is available
        if (this.intersectionObserver) {
          this.intersectionObserver.observe(cardElement);
        }
      }
    });

    // Remove cards for agents that no longer exist
    this.agentCards.forEach((card, agentId) => {
      if (!currentCardIds.has(agentId)) {
        card.destroy();
        this.agentCards.delete(agentId);
      }
    });
  }

  onMount(): void {
    // Setup Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const cardElement = entry.target as HTMLElement;
              cardElement.classList.add('agent-card--visible');
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1,
        }
      );
    }
  }

  onViewportChange(): void {
    // Re-render on viewport changes for optimal column layout
    this.render();
  }

  onDestroy(): void {
    // Disconnect Intersection Observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    // Destroy all agent cards
    this.agentCards.forEach(card => card.destroy());
    this.agentCards.clear();
  }
}
