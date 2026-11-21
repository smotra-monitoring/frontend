/**
 * Agent Details Panel
 *
 * Right-hand side panel showing one agent: General, Network and a lazily fetched
 * "Config patch preview" section. Opened from the agent table through
 * `openAgentDetails()`; content follows the agent list state, except the config
 * patch, which is fetched on expand/swap only and never refetched automatically.
 */

import { BaseComponent } from '../components/base-component.js';
import { SidePanel } from '../components/side-panel.js';
import type { ComponentState } from '../types/component-types.js';
import type { Agent } from '../types/agent-types.js';
import { getAgentById, subscribeToAgents } from '../state/agent-state.js';
import {
    closeAgentDetails,
    getAgentDetailsPanelState,
    subscribeToAgentDetailsPanel,
    type AgentDetailsPanelState,
} from '../state/agent-details-panel-state.js';
import {
    getAgentConfigState,
    loadAgentConfig,
    resetAgentConfig,
    subscribeToAgentConfig,
} from '../state/agent-config-state.js';
import { renderAgentGeneral, renderAgentNetwork } from '../utils/agent-details-render.js';
import { renderAgentConfig } from '../utils/agent-config-render.js';

export class AgentDetailsPanel extends BaseComponent<ComponentState> {
    private panel: SidePanel | null = null;
    private currentAgentId: string | null = null;
    private lastConfigRequest = getAgentDetailsPanelState().configRequest;

    constructor(root: HTMLElement) {
        super(root, {});

        this.addSubscription(subscribeToAgentDetailsPanel(state => this.onPanelState(state)));
        this.addSubscription(subscribeToAgents(() => this.onAgentsChanged()));
        this.addSubscription(subscribeToAgentConfig(() => this.renderConfigSection()));
    }

    /** The DOM is owned by the SidePanel created in onMount. */
    render(): void { }

    onMount(): void {
        closeAgentDetails();
        resetAgentConfig();

        this.panel = new SidePanel(this.root, {
            sections: [
                { id: 'general', title: 'General', defaultExpanded: true },
                { id: 'network', title: 'Network', defaultExpanded: true },
                { id: 'config', title: 'Config patch preview', defaultExpanded: false, onExpand: () => this.ensureConfigLoaded() },
            ],
            onDismiss: () => closeAgentDetails(),
            getReturnFocusTarget: () => this.findChevron(this.currentAgentId),
        });
        this.panel.mount();

        this.addEventListener(this.root, 'click', (event) => {
            const action = (event.target as Element).closest('[data-action="retry-config"], [data-action="reload-config"]');
            if (action && this.currentAgentId) {
                void loadAgentConfig(this.currentAgentId);
            }
        });
    }

    onDestroy(): void {
        closeAgentDetails();
        resetAgentConfig();
        this.panel?.destroy();
        this.panel = null;
    }

    private onPanelState(state: AgentDetailsPanelState): void {
        const panel = this.panel;
        if (!panel) return;

        const agent = state.agentId ? getAgentById(state.agentId) : null;
        if (!state.agentId || !agent) {
            this.currentAgentId = null;
            panel.close();
            resetAgentConfig();
            if (state.agentId) closeAgentDetails();
            return;
        }

        const swapped = state.agentId !== this.currentAgentId;
        this.currentAgentId = state.agentId;
        // A config of another agent must never linger in the section.
        if (swapped) resetAgentConfig();

        panel.setTitle(agent.name);
        this.renderAgentSections(agent);
        panel.show();

        if (state.configRequest !== this.lastConfigRequest) {
            this.lastConfigRequest = state.configRequest;
            panel.expandSection('config');
        }

        if (panel.isSectionExpanded('config')) this.ensureConfigLoaded();
        this.renderConfigSection();
    }

    private onAgentsChanged(): void {
        if (!this.currentAgentId || !this.panel) return;

        const agent = getAgentById(this.currentAgentId);
        if (!agent) {
            closeAgentDetails();
            return;
        }

        this.panel.setTitle(agent.name);
        this.renderAgentSections(agent);
        this.renderConfigSection();
    }

    private renderAgentSections(agent: Agent): void {
        this.panel?.setSectionContent('general', renderAgentGeneral(agent));
        this.panel?.setSectionContent('network', renderAgentNetwork(agent));
    }

    private renderConfigSection(): void {
        if (!this.panel) return;

        const state = getAgentConfigState();
        const showing = this.currentAgentId !== null && state.agentId === this.currentAgentId;
        const agent = this.currentAgentId ? getAgentById(this.currentAgentId) : null;
        this.panel.setSectionContent('config', showing ? renderAgentConfig(state, agent) : '');
    }

    private ensureConfigLoaded(): void {
        const agentId = this.currentAgentId;
        if (!agentId) return;

        const state = getAgentConfigState();
        const inProgressOrDone = state.agentId === agentId && (state.status === 'loading' || state.status === 'loaded');
        if (!inProgressOrDone) void loadAgentConfig(agentId);
    }

    private findChevron(agentId: string | null): HTMLElement | null {
        if (!agentId) return null;
        const chevrons = document.querySelectorAll<HTMLElement>('[data-action="toggle-details"]');
        return Array.from(chevrons).find(el => el.dataset.agentId === agentId) ?? null;
    }
}
