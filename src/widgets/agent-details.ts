/**
 * Agent Details Panel
 *
 * Right-hand side panel showing one agent: General, Network and a lazily fetched
 * "Config patch preview" section. Opened from the agent table through
 * `openAgentDetails()`. The agent is fetched on open/swap and the config patch on
 * expand/swap; neither is refetched automatically and neither reads the agent list.
 */

import { BaseComponent } from '../components/base-component.js';
import { SidePanel } from '../components/side-panel.js';
import type { ComponentState } from '../types/component-types.js';
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
import {
    getAgentDetailsState,
    loadAgentDetails,
    resetAgentDetails,
    subscribeToAgentDetails,
} from '../state/agent-details-state.js';
import { renderAgentGeneral, renderAgentNetwork } from '../utils/agent-details-render.js';
import { renderAgentConfig } from '../utils/agent-config-render.js';

const DEFAULT_TITLE = 'Agent details';

export class AgentDetailsPanel extends BaseComponent<ComponentState> {
    private panel: SidePanel | null = null;
    private currentAgentId: string | null = null;
    private lastConfigRequest = getAgentDetailsPanelState().configRequest;

    constructor(root: HTMLElement) {
        super(root, {});

        this.addSubscription(subscribeToAgentDetailsPanel(state => this.onPanelState(state)));
        this.addSubscription(subscribeToAgentDetails(() => this.renderAgentSections()));
        this.addSubscription(subscribeToAgentConfig(() => this.renderConfigSection()));
    }

    /** The DOM is owned by the SidePanel created in onMount. */
    render(): void { }

    onMount(): void {
        closeAgentDetails();
        resetAgentConfig();
        resetAgentDetails();

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
            const action = (event.target as Element).closest('[data-action="retry-config"], [data-action="retry-agent"]');
            if (!action || !this.currentAgentId) return;

            if (action.getAttribute('data-action') === 'retry-agent') {
                void loadAgentDetails(this.currentAgentId);
            } else if (action.getAttribute('data-action') === 'retry-config') {
                void loadAgentConfig(this.currentAgentId);
            } else {
                // Unknown action, do nothing
                console.warn('Unknown action:', action.getAttribute('data-action'));
            }

        });
    }

    onDestroy(): void {
        closeAgentDetails();
        resetAgentConfig();
        resetAgentDetails();
        this.panel?.destroy();
        this.panel = null;
    }

    private onPanelState(state: AgentDetailsPanelState): void {
        const panel = this.panel;
        if (!panel) return;

        if (!state.agentId) {
            this.currentAgentId = null;
            panel.close();
            resetAgentConfig();
            resetAgentDetails();
            return;
        }

        const swapped = state.agentId !== this.currentAgentId;
        this.currentAgentId = state.agentId;
        // Data of another agent must never linger in the sections.
        if (swapped) {
            resetAgentConfig();
            void loadAgentDetails(state.agentId);
        }

        this.renderAgentSections();
        panel.show();

        if (state.configRequest !== this.lastConfigRequest) {
            this.lastConfigRequest = state.configRequest;
            panel.expandSection('config');
        }

        if (panel.isSectionExpanded('config')) this.ensureConfigLoaded();
        this.renderConfigSection();
    }

    private renderAgentSections(): void {
        if (!this.panel) return;

        const state = getAgentDetailsState();
        const showing = this.currentAgentId !== null && state.agentId === this.currentAgentId;
        if (showing) this.panel.setTitle(state.status === 'loaded' && state.data ? state.data.name : DEFAULT_TITLE);
        this.panel.setSectionContent('general', showing ? renderAgentGeneral(state) : '');
        this.panel.setSectionContent('network', showing ? renderAgentNetwork(state) : '');
    }

    private renderConfigSection(): void {
        if (!this.panel) return;

        const state = getAgentConfigState();
        const showing = this.currentAgentId !== null && state.agentId === this.currentAgentId;
        this.panel.setSectionContent('config', showing ? renderAgentConfig(state) : '');
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
