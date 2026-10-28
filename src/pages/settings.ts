/**
 * Settings page
 * Collapsible settings sections at `/settings`; currently just the active sessions section.
 */

import { BaseComponent } from '../components/base-component.js';
import type { ComponentState } from '../types/component-types.js';
import { Sidebar } from '../components/sidebar.js';
import { ThemeToggle } from '../components/theme-toggle.js';
import { CommandPalette } from '../components/command-palette.js';
import { ToastNotification } from '../components/toast-notification.js';
import { SettingsSessions } from '../widgets/settings-sessions.js';

interface SettingsPageState extends ComponentState {
}

export class SettingsPage extends BaseComponent<SettingsPageState> {
    private sidebar: Sidebar | null = null;
    private sessionsSection: SettingsSessions | null = null;
    private themeToggle: ThemeToggle | null = null;
    private commandPalette: CommandPalette | null = null;
    private toastNotification: ToastNotification | null = null;

    constructor(root: HTMLElement) {
        super(root, {});
    }

    render(): void {
        this.root.innerHTML = `
      <div class="dashboard settings-page">
        <div id="sidebar-container"></div>

        <main class="dashboard__main">
          <div class="dashboard__toolbar">
            <h2 class="dashboard__title">Settings</h2>

            <div class="dashboard__toolbar-actions">
              <div id="theme-toggle-container"></div>
            </div>
          </div>

          <div class="dashboard__content">
            <div id="sessions-section-container"></div>
          </div>
        </main>

        <div id="command-palette-container"></div>
        <div id="toast-notification-container"></div>
      </div>
    `;

        this.initializeComponents();
    }

    private initializeComponents(): void {
        // Toasts first: the sessions section reports its results through them
        const toastContainer = this.query('#toast-notification-container');
        if (toastContainer) {
            this.toastNotification = new ToastNotification(toastContainer);
            this.toastNotification.mount();
        }

        const sidebarContainer = this.query('#sidebar-container');
        if (sidebarContainer) {
            this.sidebar = new Sidebar(sidebarContainer);
            this.sidebar.mount();
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

        const sessionsContainer = this.query('#sessions-section-container');
        if (sessionsContainer) {
            this.sessionsSection = new SettingsSessions(sessionsContainer, {
                onSuccess: (message) => this.toastNotification?.success(message),
                onError: (message) => this.toastNotification?.error(message),
            });
            this.sessionsSection.mount();
        }
    }

    onDestroy(): void {
        this.sidebar?.destroy();
        this.sessionsSection?.destroy();
        this.themeToggle?.destroy();
        this.commandPalette?.destroy();
        this.toastNotification?.destroy();
    }
}
