/**
 * Claim agent modal
 * Collects agent_id, claim_code and an optional name, then claims the agent via the API.
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import { postClaimAgent } from '../api/index.js';
import { getValidAccessToken } from '../auth/token-manager.js';
import { loadAgents } from '../state/agent-state.js';
import { navigateTo } from '../utils/navigation.js';
import {
    CLAIM_CODE_MAX_LENGTH,
    normalizeAgentName,
    validateAgentId,
    validateClaimCode,
} from '../utils/claim-validation.js';

type ClaimStatus = 'idle' | 'submitting' | 'success' | 'error';
type ClaimField = 'agentId' | 'claimCode';
type FocusTarget = ClaimField | 'name' | 'status' | null;

interface ClaimAgentModalState extends ComponentState {
    visible: boolean;
    status: ClaimStatus;
    message: string;
    agentId: string;
    claimCode: string;
    name: string;
    errors: Partial<Record<ClaimField, string>>;
    /** Field flagged by a server error whose text is shown in the status region. */
    serverField: ClaimField | null;
    pasteHints: Partial<Record<ClaimField, string>>;
}

export interface ClaimAgentModalOptions {
    onClaimed?: (message: string) => void;
    onFailed?: (message: string) => void;
}

const AGENTS_ROUTE = '/agent';
const AUTO_CLOSE_DELAY_MS = 1500;
const DEFAULT_SUCCESS_MESSAGE = 'Agent claimed successfully.';
const PASTE_DENIED_HINT = 'Clipboard access denied. Paste with Ctrl+V instead.';

const FIELD_IDS: Record<ClaimField | 'name', string> = {
    agentId: 'claim-agent-id',
    claimCode: 'claim-agent-code',
    name: 'claim-agent-name',
};

const ERROR_MESSAGES = {
    badRequest: 'The server rejected the request. Check the agent ID and claim code.',
    unauthorized: 'Your session has expired. Please sign in again.',
    invalidToken: 'The claim code is invalid or has expired.',
    notFound: 'No pending registration was found for this agent ID.',
    alreadyClaimed: 'This agent has already been claimed.',
    server: 'The server encountered an error. Please try again later.',
    network: 'Could not reach the server. Check your connection and try again.',
    unknown: 'Failed to claim the agent. Please try again.',
};

function initialState(): ClaimAgentModalState {
    return {
        visible: false,
        status: 'idle',
        message: '',
        agentId: '',
        claimCode: '',
        name: '',
        errors: {},
        serverField: null,
        pasteHints: {},
    };
}

export class ClaimAgentModal extends BaseComponent<ClaimAgentModalState> {
    private readonly options: ClaimAgentModalOptions;
    private closeTimer: ReturnType<typeof setTimeout> | null = null;
    private requestId = 0;
    private opener: HTMLElement | null = null;
    private focusTarget: FocusTarget = null;

    constructor(root: HTMLElement, options: ClaimAgentModalOptions = {}) {
        super(root, initialState());
        this.options = options;
    }

    render(): void {
        const { visible } = this.state;

        if (!visible) {
            this.root.innerHTML = '';
            return;
        }

        const { status, message, agentId, claimCode, name, errors, serverField, pasteHints } = this.state;
        const busy = status === 'submitting' || status === 'success';
        const canPaste = typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function';

        this.root.innerHTML = `
      <div class="command-palette__overlay claim-modal__overlay">
        <div
          class="command-palette__modal claim-modal ${this.isMobile() ? 'command-palette__modal--mobile' : ''}"
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-modal-title"
        >
          <div class="claim-modal__header">
            <h2 id="claim-modal-title" class="claim-modal__title">Claim agent</h2>
            <button type="button" class="command-palette__close" data-action="close" aria-label="Close">
              <span class="icon"><i class="fas fa-times"></i></span>
            </button>
          </div>

          <form class="claim-modal__form" novalidate>
            ${this.renderField({
            field: 'agentId',
            label: 'Agent ID',
            value: agentId,
            placeholder: 'example: 0197f96c-b278-7f64-a32f-dae3cabe1ff0',
            error: errors.agentId,
            flagged: serverField === 'agentId',
            hint: pasteHints.agentId,
            pasteLabel: 'Paste agent ID from clipboard',
            canPaste,
            busy,
            maxLength: 36,
        })}
                ${this.renderField({
            field: 'claimCode',
            label: 'Claim code',
            value: claimCode,
            placeholder: 'example: ABC123XY',
            error: errors.claimCode,
            flagged: serverField === 'claimCode',
            hint: pasteHints.claimCode,
            pasteLabel: 'Paste claim code from clipboard',
            canPaste,
            busy,
            maxLength: CLAIM_CODE_MAX_LENGTH,
        })}

            <div class="claim-modal__field">
              <label class="claim-modal__label" for="${FIELD_IDS.name}">
                Agent name <span class="claim-modal__optional">(optional)</span>
              </label>
              <input
                id="${FIELD_IDS.name}"
                class="claim-modal__input"
                type="text"
                name="name"
                autocomplete="off"
                placeholder="Defaults to the agent's hostname"
                value="${this.escapeHtml(name)}"
                ${busy ? 'disabled' : ''}
              />
            </div>

            <div
              id="claim-modal-status"
              class="claim-modal__status claim-modal__status--${status}"
              role="${status === 'error' ? 'alert' : 'status'}"
              tabindex="-1"
            >${this.renderStatus(status, message)}</div>

            <div class="claim-modal__actions">
              <button type="button" class="button is-light claim-modal__cancel" data-action="close">Cancel</button>
              <button type="submit" class="button is-info claim-modal__submit" ${busy ? 'disabled' : ''}>Claim</button>
            </div>
          </form>
        </div>
      </div>
    `;

        this.attachEventListeners();
        this.applyFocus();
    }

    private renderField(f: {
        field: ClaimField;
        label: string;
        value: string;
        placeholder: string;
        error?: string;
        flagged: boolean;
        hint?: string;
        pasteLabel: string;
        canPaste: boolean;
        busy: boolean;
        maxLength: number;
    }): string {
        const id = FIELD_IDS[f.field];
        const describedBy: string[] = [];
        if (f.error) describedBy.push(`${id}-error`);
        if (f.hint) describedBy.push(`${id}-hint`);
        if (f.flagged) describedBy.push('claim-modal-status');
        const invalid = Boolean(f.error) || f.flagged;

        return `
      <div class="claim-modal__field">
        <label class="claim-modal__label" for="${id}">${f.label}</label>
        <div class="claim-modal__input-row">
          <input
            id="${id}"
            class="claim-modal__input ${invalid ? 'claim-modal__input--invalid' : ''}"
            type="text"
            name="${f.field}"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="${f.placeholder}"
            maxlength="${f.maxLength}"
            value="${this.escapeHtml(f.value)}"
            aria-required="true"
            aria-invalid="${invalid}"
            ${describedBy.length ? `aria-describedby="${describedBy.join(' ')}"` : ''}
            ${f.busy ? 'disabled' : ''}
          />
          ${f.canPaste ? `
            <button
              type="button"
              class="claim-modal__paste"
              data-paste-target="${f.field}"
              aria-label="${f.pasteLabel}"
              title="Paste from clipboard"
              ${f.busy ? 'disabled' : ''}
            >
              <span class="icon"><i class="fas fa-paste" aria-hidden="true"></i></span>
            </button>
          ` : ''}
        </div>
        ${f.error ? `<p id="${id}-error" class="claim-modal__error" role="alert">${this.escapeHtml(f.error)}</p>` : ''}
        ${f.hint ? `<p id="${id}-hint" class="claim-modal__hint">${this.escapeHtml(f.hint)}</p>` : ''}
      </div>
    `;
    }

    private renderStatus(status: ClaimStatus, message: string): string {
        if (status === 'submitting') {
            return '<span class="claim-modal__spinner" aria-hidden="true"></span>Claiming…';
        }
        return this.escapeHtml(message);
    }

    private attachEventListeners(): void {
        const form = this.query<HTMLFormElement>('.claim-modal__form');
        const overlay = this.query('.claim-modal__overlay');

        this.queryAll('[data-action="close"]').forEach((button) => {
            this.addEventListener(button, 'click', () => this.hide());
        });

        if (overlay) {
            this.addEventListener(overlay, 'click', (e) => {
                if (e.target === overlay) {
                    this.hide();
                }
            });
        }

        if (form) {
            this.addEventListener(form, 'submit', (e) => {
                e.preventDefault();
                void this.submit();
            });

            this.addEventListener(form, 'input', (e) => {
                this.handleInput(e.target as HTMLInputElement);
            });

            this.addEventListener(form, 'click', (e) => {
                const button = (e.target as HTMLElement).closest<HTMLElement>('[data-paste-target]');
                if (button && !(button as HTMLButtonElement).disabled) {
                    void this.paste(button.dataset.pasteTarget as ClaimField);
                }
            });
        }

        this.addEventListener(window, 'keydown', (e) => this.handleKeydown(e as KeyboardEvent));
    }

    private handleKeydown(e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.hide();
            return;
        }

        if (e.key === 'Tab') {
            this.trapFocus(e);
        }
    }

    private trapFocus(e: KeyboardEvent): void {
        const modal = this.query('.claim-modal');
        if (!modal) return;

        const focusable = Array.from(
            modal.querySelectorAll<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])')
        ).filter((el) => !(el as HTMLButtonElement).disabled);

        if (focusable.length === 0) {
            e.preventDefault();
            return;
        }

        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        const active = document.activeElement as HTMLElement | null;
        const inside = active ? modal.contains(active) : false;

        if (e.shiftKey && (!inside || active === first)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && (!inside || active === last)) {
            e.preventDefault();
            first.focus();
        }
    }

    private handleInput(input: HTMLInputElement): void {
        const field = input.name as ClaimField | 'name';
        if (field !== 'agentId' && field !== 'claimCode' && field !== 'name') return;

        this.state = { ...this.state, [field]: input.value };

        if (field !== 'name' && (this.state.errors[field] || this.state.serverField === field)) {
            const { [field]: _removed, ...errors } = this.state.errors;
            this.state = {
                ...this.state,
                errors,
                serverField: this.state.serverField === field ? null : this.state.serverField,
            };
            // Patch the DOM instead of re-rendering so focus and caret position are kept.
            input.setAttribute('aria-invalid', 'false');
            input.removeAttribute('aria-describedby');
            input.classList.remove('claim-modal__input--invalid');
            this.query(`#${FIELD_IDS[field]}-error`)?.remove();
        }
    }

    /** Copies live input values into state; needed because setState re-renders from state. */
    private readForm(): void {
        const read = (field: ClaimField | 'name'): string =>
            this.query<HTMLInputElement>(`#${FIELD_IDS[field]}`)?.value ?? this.state[field];

        this.state = {
            ...this.state,
            agentId: read('agentId'),
            claimCode: read('claimCode'),
            name: read('name'),
        };
    }

    private async paste(field: ClaimField): Promise<void> {
        this.readForm();
        const requestId = this.requestId;

        let text: string;
        try {
            text = (await navigator.clipboard.readText()).trim();
        } catch {
            if (!this.isSameModalSession(requestId)) return;
            this.focusTarget = field;
            this.setState({ pasteHints: { ...this.state.pasteHints, [field]: PASTE_DENIED_HINT } });
            return;
        }
        if (!this.isSameModalSession(requestId)) return;

        const validator = field === 'agentId' ? validateAgentId : validateClaimCode;
        const error = validator(text);
        const { [field]: _hint, ...pasteHints } = this.state.pasteHints;
        const { [field]: _error, ...errors } = this.state.errors;

        this.focusTarget = field;
        this.setState({
            [field]: text,
            errors: error ? { ...errors, [field]: error } : errors,
            pasteHints,
            serverField: this.state.serverField === field ? null : this.state.serverField,
        } as Partial<ClaimAgentModalState>);
    }

    private async submit(): Promise<void> {
        if (this.state.status === 'submitting' || this.state.status === 'success') return;

        this.readForm();
        const agentId = this.state.agentId.trim();
        const claimCode = this.state.claimCode.trim();

        const errors: ClaimAgentModalState['errors'] = {};
        const agentIdError = validateAgentId(agentId);
        const claimCodeError = validateClaimCode(claimCode);
        if (agentIdError) errors.agentId = agentIdError;
        if (claimCodeError) errors.claimCode = claimCodeError;

        if (agentIdError || claimCodeError) {
            this.focusTarget = agentIdError ? 'agentId' : 'claimCode';
            this.setState({ status: 'idle', message: '', errors, serverField: null, pasteHints: {} });
            return;
        }

        const requestId = ++this.requestId;
        this.focusTarget = 'status';
        this.setState({ status: 'submitting', message: '', errors: {}, serverField: null, pasteHints: {} });

        try {
            const result = await postClaimAgent({
                body: { agentId, claimToken: claimCode, name: normalizeAgentName(this.state.name) },
                auth: async () => (await getValidAccessToken()) ?? undefined,
            });

            if (!this.isSameModalSession(requestId)) return;

            if (result.error || !result.data) {
                const { message, field } = ClaimAgentModal.describeError(result.response?.status, result.error?.message);
                this.fail(message, field);
                return;
            }

            this.succeed(result.data.message || DEFAULT_SUCCESS_MESSAGE);
        } catch {
            if (!this.isSameModalSession(requestId)) return;
            this.fail(ERROR_MESSAGES.network, null);
        }
    }

    private succeed(message: string): void {
        this.focusTarget = 'status';
        this.setState({ status: 'success', message });
        this.options.onClaimed?.(message);

        this.closeTimer = setTimeout(() => {
            this.closeTimer = null;
            this.hide();
            loadAgents().catch((error) => console.error('Failed to reload agents after claim:', error));
            if (window.location.pathname !== AGENTS_ROUTE) {
                void navigateTo(AGENTS_ROUTE);
            }
        }, AUTO_CLOSE_DELAY_MS);
    }

    private fail(message: string, field: ClaimField | null): void {
        this.focusTarget = field ?? 'status';
        this.setState({ status: 'error', message, serverField: field });
        this.options.onFailed?.(message);
    }

    private static describeError(
        status: number | undefined,
        serverMessage: string | undefined
    ): { message: string; field: ClaimField | null } {
        if (status === undefined) {
            return { message: ERROR_MESSAGES.network, field: null };
        }

        switch (status) {
            case 400:
                return { message: serverMessage || ERROR_MESSAGES.badRequest, field: null };
            case 401:
                return { message: ERROR_MESSAGES.unauthorized, field: null };
            case 403:
                return { message: ERROR_MESSAGES.invalidToken, field: 'claimCode' };
            case 404:
                return { message: ERROR_MESSAGES.notFound, field: 'agentId' };
            case 409:
                return { message: ERROR_MESSAGES.alreadyClaimed, field: 'agentId' };
            default:
                return { message: status >= 500 ? ERROR_MESSAGES.server : ERROR_MESSAGES.unknown, field: null };
        }
    }

    /** False once the modal was closed, destroyed or reopened since the async work started. */
    private isSameModalSession(requestId: number): boolean {
        return !this.isDestroyed() && this.state.visible && requestId === this.requestId;
    }

    private applyFocus(): void {
        const target = this.focusTarget;
        this.focusTarget = null;
        if (!target) return;

        const selector = target === 'status' ? '#claim-modal-status' : `#${FIELD_IDS[target]}`;
        this.query(selector)?.focus();
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/"/g, '&quot;');
    }

    show(): void {
        this.clearTimer();
        this.requestId++;
        this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;  // IMO "+ Claim" button will always be the opener, you have to click on it to open the modal, which makes it the active element
        this.focusTarget = 'agentId';
        this.setState({ ...initialState(), visible: true });
    }

    hide(): void {
        if (!this.state.visible) return;

        this.clearTimer();
        this.requestId++;
        this.setState({ visible: false });

        if (this.opener?.isConnected) {
            this.opener.focus();
        }
        this.opener = null;
    }

    private clearTimer(): void {
        if (this.closeTimer !== null) {
            clearTimeout(this.closeTimer);
            this.closeTimer = null;
        }
    }

    onDestroy(): void {
        this.clearTimer();
        this.requestId++;
    }
}
