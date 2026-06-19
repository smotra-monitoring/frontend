/**
 * Dashboard page
 * Main monitoring dashboard with Bento-Box layout
 */

import { BaseComponent } from '../components/base-component.js';
import type { ComponentState } from '../types/component-types.js';
import { DashboardGrid } from '../components/dashboard-grid.js';
import { Sidebar } from '../components/sidebar.js';
import { ThemeToggle } from '../components/theme-toggle.js';
import { CommandPalette } from '../components/command-palette.js';
import { ToastNotification } from '../components/toast-notification.js';
import { connect as connectWebSocket, disconnect as disconnectWebSocket } from '../services/websocket-service.js';
import { loadAgents } from '../state/agent-state.js';
import { RefreshControl } from '../components/refresh-control.js';

interface DashboardPageState extends ComponentState {
}

/**
 * Main dashboard page
 */
export class DashboardPage extends BaseComponent<DashboardPageState> {
  private sidebar: Sidebar | null = null;
  private dashboardGrid: DashboardGrid | null = null;
  private themeToggle: ThemeToggle | null = null;
  private commandPalette: CommandPalette | null = null;
  private toastNotification: ToastNotification | null = null;
  private refreshControl: RefreshControl | null = null;

  constructor(root: HTMLElement) {
    super(root, {});
  }

  render(): void {
    this.root.innerHTML = `
      <div class="dashboard">
        <!-- Sidebar/Navigation -->
        <div id="sidebar-container"></div>
        
        <!-- Main Content -->
        <main class="dashboard__main">
          <div class="dashboard__toolbar">
            <h2 class="dashboard__title">Dashboard</h2>
            
            <div class="dashboard__toolbar-actions">
              <div id="refresh-control-container"></div>
              <div id="theme-toggle-container"></div>
            </div>
          </div>
          
          <div class="dashboard__content">
            <div id="dashboard-grid-container"></div>
          </div>
        </main>
        
        <!-- Command Palette -->
        <div id="command-palette-container"></div>
        
        <!-- Toast Notifications -->
        <div id="toast-notification-container"></div>
      </div>
    `;

    // Initialize child components
    this.initializeComponents();
  }

  private initializeComponents(): void {
    // Sidebar
    const sidebarContainer = this.query('#sidebar-container');
    if (sidebarContainer) {
      this.sidebar = new Sidebar(sidebarContainer);
      this.sidebar.mount();
    }

    // Dashboard Grid
    const gridContainer = this.query('#dashboard-grid-container');
    if (gridContainer) {
      this.dashboardGrid = new DashboardGrid(gridContainer);
      this.dashboardGrid.mount();
    }

    // Refresh Control
    const refreshControlContainer = this.query('#refresh-control-container');
    if (refreshControlContainer) {
      this.refreshControl = new RefreshControl(refreshControlContainer);
      this.refreshControl.mount();
    }

    // Theme Toggle
    const themeToggleContainer = this.query('#theme-toggle-container');
    if (themeToggleContainer) {
      this.themeToggle = new ThemeToggle(themeToggleContainer);
      this.themeToggle.mount();
    }

    // Command Palette
    const commandPaletteContainer = this.query('#command-palette-container');
    if (commandPaletteContainer) {
      this.commandPalette = new CommandPalette(commandPaletteContainer);
      this.commandPalette.mount();
    }

    // Toast Notifications
    const toastContainer = this.query('#toast-notification-container');
    if (toastContainer) {
      this.toastNotification = new ToastNotification(toastContainer);
      this.toastNotification.mount();
    }
  }

  async onMount(): Promise<void> {
    try {
      // Load agent data
      await loadAgents();

      /*
      // Connect to WebSocket for real-time updates
      const connected = await connectWebSocket();

      if (!connected) {
        console.warn('Failed to establish WebSocket connection');
        // Show warning toast
        if (this.toastNotification) {
          this.toastNotification.warning('Real-time updates unavailable. Retrying...');
        }
      }
      */
    } catch (error) {
      console.error('Dashboard initialization error:', error);

      if (this.toastNotification) {
        this.toastNotification.error('Failed to load dashboard data');
      }
    }
  }

  onDestroy(): void {
    // Cleanup child components
    this.sidebar?.destroy();
    this.dashboardGrid?.destroy();
    this.themeToggle?.destroy();
    this.commandPalette?.destroy();
    this.toastNotification?.destroy();
    this.refreshControl?.destroy();

    // Disconnect WebSocket
    // disconnectWebSocket();
  }
}
