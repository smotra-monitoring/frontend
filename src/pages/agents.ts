/**
 * Agents page
 * Dedicated full-width view rendering the AgentStatesWidget at `/agent`
 */

import { BaseComponent } from '../components/base-component.js';
import type { ComponentState } from '../types/component-types.js';
import { Sidebar } from '../components/sidebar.js';
import { ThemeToggle } from '../components/theme-toggle.js';
import { CommandPalette } from '../components/command-palette.js';
import { ToastNotification } from '../components/toast-notification.js';
import { RefreshControl } from '../components/refresh-control.js';
import { ClaimAgentModal } from '../components/claim-agent-modal.js';
import { AgentStatesWidget } from '../widgets/agent-states.js';
import { getAgents, loadAgents } from '../state/agent-state.js';

interface AgentsPageState extends ComponentState {
}

/**
 * Agents page hosting the AgentStatesWidget
 */
export class AgentsPage extends BaseComponent<AgentsPageState> {
  private sidebar: Sidebar | null = null;
  private agentStatesWidget: AgentStatesWidget | null = null;
  private themeToggle: ThemeToggle | null = null;
  private commandPalette: CommandPalette | null = null;
  private toastNotification: ToastNotification | null = null;
  private refreshControl: RefreshControl | null = null;
  private claimModal: ClaimAgentModal | null = null;

  constructor(root: HTMLElement) {
    super(root, {});
  }

  render(): void {
    this.root.innerHTML = `
      <div class="dashboard agents-page">
        <div id="sidebar-container"></div>

        <main class="dashboard__main">
          <div class="dashboard__toolbar">
            <h2 class="dashboard__title">Agents</h2>

            <div class="dashboard__toolbar-actions">
              <button
                type="button"
                id="claim-agent-button"
                class="button is-info claim-button"
                aria-label="Claim an agent"
                aria-haspopup="dialog"
              >
                <span class="icon"><i class="fas fa-plus" aria-hidden="true"></i></span>
                <span>Claim</span>
              </button>
              <div id="refresh-control-container"></div>
              <div id="theme-toggle-container"></div>
            </div>
          </div>

          <div class="dashboard__content">
            <div id="agent-states-container" class="agents-page__widget"></div>
          </div>
        </main>

        <div id="command-palette-container"></div>
        <div id="claim-modal-container"></div>
        <div id="toast-notification-container"></div>
      </div>
    `;

    this.initializeComponents();
  }

  private initializeComponents(): void {
    const sidebarContainer = this.query('#sidebar-container');
    if (sidebarContainer) {
      this.sidebar = new Sidebar(sidebarContainer);
      this.sidebar.mount();
    }

    const widgetContainer = this.query('#agent-states-container');
    if (widgetContainer) {
      this.agentStatesWidget = new AgentStatesWidget(widgetContainer, getAgents());
      this.agentStatesWidget.mount();
    }

    const refreshControlContainer = this.query('#refresh-control-container');
    if (refreshControlContainer) {
      this.refreshControl = new RefreshControl(refreshControlContainer);
      this.refreshControl.mount();
    }

    const themeToggleContainer = this.query('#theme-toggle-container');
    if (themeToggleContainer) {
      this.themeToggle = new ThemeToggle(themeToggleContainer);
      this.themeToggle.mount();
    }

    const commandPaletteContainer = this.query('#command-palette-container');
    if (commandPaletteContainer) {
      this.commandPalette = new CommandPalette(commandPaletteContainer);
      this.commandPalette.mount();
    }

    const toastContainer = this.query('#toast-notification-container');
    if (toastContainer) {
      this.toastNotification = new ToastNotification(toastContainer);
      this.toastNotification.mount();
    }

    const claimModalContainer = this.query('#claim-modal-container');
    if (claimModalContainer) {
      this.claimModal = new ClaimAgentModal(claimModalContainer, {
        onClaimed: (message) => this.toastNotification?.success(message),
        onFailed: (message) =>
          this.toastNotification?.show({ message, type: 'error', duration: 5000, dismissible: true }),
      });
      this.claimModal.mount();
    }

    const claimButton = this.query('#claim-agent-button');
    if (claimButton) {
      this.addEventListener(claimButton, 'click', () => this.claimModal?.show());
    }
  }

  async onMount(): Promise<void> {
    try {
      await loadAgents();
    } catch (error) {
      console.error('Agents page initialization error:', error);
      this.toastNotification?.error('Failed to load agents');
    }
  }

  onDestroy(): void {
    this.sidebar?.destroy();
    this.agentStatesWidget?.destroy();
    this.themeToggle?.destroy();
    this.commandPalette?.destroy();
    this.toastNotification?.destroy();
    this.refreshControl?.destroy();
    this.claimModal?.destroy();
  }
}
