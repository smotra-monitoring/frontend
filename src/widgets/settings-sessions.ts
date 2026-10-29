/**
 * Sessions Section Widget
 *
 * Collapsible settings section listing the user's active sessions, one per line,
 * with a per-session "Terminate" button and a "Terminate All" button at the top.
 *
 * Folding is native `<details>` + CSS: the open/closed state is never stored in component state.
 * The `<details>` shell is rendered once and only its contents are updated afterwards,
 * so reloads do not reset what the user folded.
 */

import { BaseComponent } from '../components/base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { Session } from '../api/index.js';
import {
    fetchSessions,
    terminateSession,
    terminateOtherSessions,
    SessionServiceError,
} from '../services/session-service.js';
import { describeDevice, isMobile } from '../utils/user-agent.js';
import { formatAbsoluteDate, formatLastSeen } from '../utils/agent-utils.js';
import { escapeHtml } from '../utils/dom-helpers.js';

interface SettingsSessionsState extends ComponentState {
    sessions: Session[];
    /** True until the first load finishes */
    loading: boolean;
    /** True while a terminate request and the following reload are in flight */
    busy: boolean;
    error: string | null;
}

export interface SettingsSessionsOptions {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

/** Time the first click stays armed before the button reverts */
const CONFIRM_TIMEOUT_MS = 4000;

const EMPTY_VALUE = '—';

export class SettingsSessions extends BaseComponent<SettingsSessionsState> {
    private readonly options: SettingsSessionsOptions;
    private confirmTimers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
    private operationId = 0;

    constructor(root: HTMLElement, options: SettingsSessionsOptions = {}) {
        super(root, { sessions: [], loading: true, busy: false, error: null });
        this.options = options;
    }

    render(): void {
        this.clearConfirmTimers();

        if (!this.query('.settings-section')) {
            this.root.innerHTML = this.renderShell();
        }

        this.updateSection();
        this.attachEventListeners();
    }

    onMount(): void {
        void this.load();
    }

    onDestroy(): void {
        this.clearConfirmTimers();
    }

    /** Fetch sessions and update the list; also used to refresh after an action. */
    async load(): Promise<void> {
        const isStale = this.beginOperation();

        try {
            const sessions = await fetchSessions();
            if (isStale()) return;
            this.setState({ sessions, loading: false, busy: false, error: null });
        } catch (error) {
            if (isStale()) return;
            const message = this.messageOf(error, 'Failed to load sessions');
            this.setState({ loading: false, busy: false, error: message });
            this.options.onError?.(message);
        }
    }

    /**
     * Start an async operation. The returned guard reports true once the component is destroyed
     * or a newer operation has started, so late results must be dropped.
     */
    private beginOperation(): () => boolean {
        const id = ++this.operationId;
        return () => this.isDestroyed() || id !== this.operationId;
    }

    // ---- Rendering ----

    private renderShell(): string {
        return `
      <details class="settings-section" open>
        <summary class="settings-section__summary">
          <h3 class="settings-section__title">Active sessions</h3>
          <span class="settings-section__count" data-role="count"></span>
          <span class="settings-section__chevron" aria-hidden="true"><i class="fas fa-chevron-down"></i></span>
        </summary>

        <div class="settings-section__body">
          <div class="settings-section__toolbar">
            <p class="settings-section__hint">Devices signed in to your account. Terminating all keeps this device signed in.</p>
            <button
              type="button"
              class="button session-action session-action--danger"
              data-action="terminate-all"
              data-label="Terminate All"
              data-confirm-label="Confirm?"
              data-aria-label="Terminate all other sessions"
              data-confirm-aria-label="Confirm terminating all other sessions"
              aria-label="Terminate all other sessions"
            >
              <span class="icon"><i class="fas fa-ban" aria-hidden="true"></i></span>
              <span class="session-action__label">Terminate All</span>
            </button>
          </div>

          <p class="is-sr-only" role="status" aria-live="polite" data-role="status"></p>
          <div data-role="content"></div>
        </div>
      </details>
    `;
    }

    private updateSection(): void {
        const { sessions, loading, busy, error } = this.state;
        const otherCount = sessions.filter(s => !s.is_current).length;

        const count = this.query('[data-role="count"]');
        if (count) {
            count.textContent = loading ? '' : String(sessions.length);
            count.setAttribute('aria-label', `${sessions.length} active ${sessions.length === 1 ? 'session' : 'sessions'}`);
            count.hidden = loading;
        }

        const status = this.query('[data-role="status"]');
        if (status) {
            status.textContent = loading
                ? 'Loading sessions'
                : error ?? `${sessions.length} active ${sessions.length === 1 ? 'session' : 'sessions'}`;
        }

        const terminateAll = this.query<HTMLButtonElement>('[data-action="terminate-all"]');
        if (terminateAll) {
            this.resetConfirm(terminateAll);
            terminateAll.disabled = loading || busy || otherCount === 0;
        }

        const content = this.query('[data-role="content"]');
        if (content) {
            content.innerHTML = this.renderContent();
        }
    }

    private renderContent(): string {
        const { sessions, loading, error } = this.state;

        if (loading) {
            return '<p class="settings-section__message">Loading sessions...</p>';
        }

        const errorHtml = error
            ? `<p class="settings-section__message settings-section__message--error" role="alert">${escapeHtml(error)}</p>`
            : '';

        if (sessions.length === 0) {
            return error ? errorHtml : '<p class="settings-section__message">No active sessions.</p>';
        }

        return `
      ${errorHtml}
      <ul class="session-list" aria-label="Active sessions">
        ${sessions.map(session => this.renderSession(session)).join('')}
      </ul>
    `;
    }

    private renderSession(session: Session): string {
        const device = describeDevice(session.user_agent);
        const current = session.is_current;
        const busy = this.state.busy;
        const safeDevice = escapeHtml(device);

        return `
      <li class="session-row ${current ? 'session-row--current' : ''}" data-session-id="${escapeHtml(session.id)}">
        <div class="session-row__main">
          <div class="session-row__device">
            <i class="fas ${isMobile(session.user_agent) ? 'fa-mobile' : 'fa-desktop'} session-row__icon" aria-hidden="true"></i>
            <span class="session-row__device-name">${safeDevice}</span>
            ${current ? '<span class="session-row__badge">This device</span>' : ''}
          </div>

          <dl class="session-row__fields">
            ${this.renderField('IP address', session.ip_address ? `<code>${escapeHtml(session.ip_address)}</code>` : EMPTY_VALUE)}
            ${this.renderField('Provider', escapeHtml(session.provider))}
            ${this.renderField('Created', this.renderTime(session.created_at))}
            ${this.renderField('Last used', `${this.renderTime(session.last_used_at)} (${escapeHtml(formatLastSeen(session.last_used_at))})`)}
            ${this.renderField('Expires', this.renderTime(session.expires_at))}
            ${this.renderField('Session ID', `<code>${escapeHtml(session.id)}</code>`)}
            ${this.renderField('User agent', session.user_agent ? escapeHtml(session.user_agent) : EMPTY_VALUE, true)}
          </dl>
        </div>

        <div class="session-row__actions">
          <button
            type="button"
            class="button session-action session-action--danger"
            data-action="terminate"
            data-session-id="${escapeHtml(session.id)}"
            data-label="Terminate"
            data-confirm-label="Confirm?"
            data-aria-label="Terminate session on ${safeDevice}"
            data-confirm-aria-label="Confirm terminating session on ${safeDevice}"
            aria-label="${current ? `Current session on ${safeDevice} cannot be terminated` : `Terminate session on ${safeDevice}`}"
            ${current || busy ? 'disabled' : ''}
          >
            <span class="icon"><i class="fas fa-times-circle" aria-hidden="true"></i></span>
            <span class="session-action__label">Terminate</span>
          </button>
        </div>
      </li>
    `;
    }

    private renderField(label: string, valueHtml: string, wide = false): string {
        return `
      <div class="session-row__field ${wide ? 'session-row__field--wide' : ''}">
        <dt>${label}</dt>
        <dd>${valueHtml}</dd>
      </div>
    `;
    }

    private renderTime(date: Date): string {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            return EMPTY_VALUE;
        }
        return `<time datetime="${date.toISOString()}">${escapeHtml(formatAbsoluteDate(date))}</time>`;
    }

    // ---- Events ----

    private attachEventListeners(): void {
        const section = this.query('.settings-section');
        if (!section) return;

        this.addEventListener(section, 'click', (e) => {
            const button = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
            if (!button || button.disabled) return;

            if (button.dataset.confirming !== 'true') {
                this.armConfirm(button);
                return;
            }

            this.resetConfirm(button);
            if (button.dataset.action === 'terminate-all') {
                void this.terminateAll();
            } else if (button.dataset.sessionId) {
                void this.terminate(button.dataset.sessionId);
            }
        });

        // Disarm when focus leaves the button
        this.addEventListener(section, 'focusout', (e) => {
            const button = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
            if (button?.dataset.confirming === 'true') {
                this.resetConfirm(button);
            }
        });
    }

    /** First click of the two-step confirmation; DOM-only so no re-render happens. */
    private armConfirm(button: HTMLButtonElement): void {
        button.dataset.confirming = 'true';
        this.setButtonLabel(button, button.dataset.confirmLabel, button.dataset.confirmAriaLabel);

        this.confirmTimers.set(
            button,
            setTimeout(() => this.resetConfirm(button), CONFIRM_TIMEOUT_MS)
        );
    }

    private resetConfirm(button: HTMLButtonElement): void {
        const timer = this.confirmTimers.get(button);
        if (timer !== undefined) {
            clearTimeout(timer);
            this.confirmTimers.delete(button);
        }

        if (button.dataset.confirming === 'true') {
            delete button.dataset.confirming;
            this.setButtonLabel(button, button.dataset.label, button.dataset.ariaLabel);
        }
    }

    private setButtonLabel(button: HTMLButtonElement, label?: string, ariaLabel?: string): void {
        const labelEl = button.querySelector('.session-action__label');
        if (labelEl && label) labelEl.textContent = label;
        if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
    }

    private clearConfirmTimers(): void {
        this.confirmTimers.forEach(timer => clearTimeout(timer));
        this.confirmTimers.clear();
    }

    // ---- Actions ----

    private terminate(sessionId: string): Promise<void> {
        return this.runTerminationRequests(
            async () => {
                await terminateSession(sessionId);
                return 'Session terminated.';
            },
            'Failed to terminate session'
        );
    }

    private terminateAll(): Promise<void> {
        return this.runTerminationRequests(
            async () => {
                const count = await terminateOtherSessions();
                return count === 1 ? 'Terminated 1 other session.' : `Terminated ${count} other sessions.`;
            },
            'Failed to terminate sessions'
        );
    }

    /** Run a terminate request, report the outcome, then reload the list. */
    private async runTerminationRequests(action: () => Promise<string>, failureMessage: string): Promise<void> {
        this.setState({ busy: true });
        const isStale = this.beginOperation();

        try {
            const message = await action();
            if (isStale()) return;
            this.options.onSuccess?.(message);
        } catch (error) {
            if (isStale()) return;
            // Already gone (404): the reload below shows the current truth
            if (!(error instanceof SessionServiceError && error.status === 404)) {
                this.options.onError?.(this.messageOf(error, failureMessage));
            }
        }

        await this.load();
        this.restoreFocus();
    }

    /** The clicked button is replaced on re-render; keep keyboard focus inside the section. */
    private restoreFocus(): void {
        if (this.isDestroyed()) return;
        this.query<HTMLElement>('.settings-section__summary')?.focus();
    }

    private messageOf(error: unknown, fallback: string): string {
        return error instanceof Error && error.message ? error.message : fallback;
    }
}
