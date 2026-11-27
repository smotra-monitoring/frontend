/**
 * Side panel
 * Non-modal overlay docked to the right edge with collapsible sections.
 * The shell is rendered once; content is updated per section so focus and scroll are preserved.
 * Section open/closed state is held in memory only: sections start at their defaults when the page loads
 * and keep the user's choice across close/reopen until the page is reloaded.
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import { escapeHtml } from '../utils/dom-helpers.js';

export interface SidePanelSection {
    id: string;
    title: string;
    defaultExpanded: boolean;
    /** Called when a section is expanded, and for every expanded section each time the panel is shown. */
    onExpand?: () => void;
}

export type SidePanelDismissReason = 'button' | 'escape' | 'outside';

export interface SidePanelOptions {
    sections: SidePanelSection[];
    /** Called after the user dismissed the panel; the panel itself is already closed. */
    onDismiss?: (reason: SidePanelDismissReason) => void;
    /** Element to focus after a keyboard or button dismissal; evaluated before the panel closes. */
    getReturnFocusTarget?: () => HTMLElement | null;
}

export const SIDE_PANEL_ID = 'side-panel';

export class SidePanel extends BaseComponent<ComponentState> {
    private readonly options: SidePanelOptions;
    private readonly expanded = new Map<string, boolean>();
    private open = false;

    private readonly onDocumentClick = (event: Event): void => {
        const target = event.target as Element | null;
        if (!this.open || !target) return;
        if (this.root.contains(target)) return;
        // Rows are triggers: they swap the content instead of closing the panel.
        if (target.closest('[data-agent-row]')) return;
        this.dismiss('outside');
    };

    private readonly onKeyDown = (event: Event): void => {
        if ((event as KeyboardEvent).key !== 'Escape' || !this.open) return;
        // A modal dialog on top (e.g. claim agent) handles Escape itself.
        if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
        this.dismiss('escape');
    };

    constructor(root: HTMLElement, options: SidePanelOptions) {
        super(root, {});
        this.options = options;
        options.sections.forEach(section => this.expanded.set(section.id, section.defaultExpanded));
    }

    render(): void {
        const sections = this.options.sections.map(section => {
            const bodyId = `${SIDE_PANEL_ID}-section-${section.id}`;
            const toggleId = `${SIDE_PANEL_ID}-toggle-${section.id}`;
            const expanded = this.expanded.get(section.id) === true;

            return `
        <section class="side-panel__section" data-section-id="${escapeHtml(section.id)}">
          <h3 class="side-panel__section-heading">
            <button
              type="button"
              id="${toggleId}"
              class="side-panel__section-toggle"
              data-action="toggle-section"
              data-section-id="${escapeHtml(section.id)}"
              aria-expanded="${expanded}"
              aria-controls="${bodyId}"
            >
              <span>${escapeHtml(section.title)}</span>
              <span class="icon"><i class="fas fa-chevron-down" aria-hidden="true"></i></span>
            </button>
          </h3>
          <div
            id="${bodyId}"
            class="side-panel__section-body"
            role="region"
            aria-labelledby="${toggleId}"
            ${expanded ? '' : 'hidden'}
          ></div>
        </section>
      `;
        }).join('');

        this.root.innerHTML = `
      <aside
        id="${SIDE_PANEL_ID}"
        class="side-panel"
        aria-labelledby="${SIDE_PANEL_ID}-title"
        aria-hidden="true"
        tabindex="-1"
        inert
      >
        <header class="side-panel__header">
          <h2 id="${SIDE_PANEL_ID}-title" class="side-panel__title" aria-live="polite"></h2>
          <button type="button" class="side-panel__close" data-action="close-panel" aria-label="Close details">
            <span class="icon"><i class="fas fa-times" aria-hidden="true"></i></span>
          </button>
        </header>
        <div class="side-panel__body">${sections}</div>
      </aside>
    `;
    }

    onMount(): void {
        this.addEventListener(this.root, 'click', (event) => {
            const target = event.target as Element;

            if (target.closest('[data-action="close-panel"]')) {
                this.dismiss('button');
                return;
            }

            const toggle = target.closest<HTMLElement>('[data-action="toggle-section"]');
            if (toggle?.dataset.sectionId) {
                this.toggleSection(toggle.dataset.sectionId);
            }
        });

        document.addEventListener('click', this.onDocumentClick, true);
        document.addEventListener('keydown', this.onKeyDown);
    }

    onDestroy(): void {
        document.removeEventListener('click', this.onDocumentClick, true);
        document.removeEventListener('keydown', this.onKeyDown);
    }

    isOpen(): boolean {
        return this.open;
    }

    show(): void {
        if (this.open) return;
        this.open = true;

        const panel = this.panelElement();
        panel?.removeAttribute('inert');
        panel?.setAttribute('aria-hidden', 'false');
        panel?.classList.add('side-panel--open');
        panel?.focus({ preventScroll: true });

        // Content is cleared while closed, so expanded sections must load again.
        this.options.sections.filter(s => this.isSectionExpanded(s.id)).forEach(s => s.onExpand?.());
    }

    /** Hide the panel without notifying `onDismiss`. */
    close(): void {
        if (!this.open) return;
        this.open = false;

        const panel = this.panelElement();
        panel?.classList.remove('side-panel--open');
        panel?.setAttribute('aria-hidden', 'true');
        panel?.setAttribute('inert', '');
    }

    setTitle(title: string): void {
        const heading = this.query(`#${SIDE_PANEL_ID}-title`);
        if (heading) heading.textContent = title;
    }

    setSectionContent(sectionId: string, html: string): void {
        const body = this.sectionBody(sectionId);
        if (body) body.innerHTML = html;
    }

    isSectionExpanded(sectionId: string): boolean {
        return this.expanded.get(sectionId) === true;
    }

    /** Expand a section; a no-op when it is already expanded. */
    expandSection(sectionId: string): void {
        if (this.isSectionExpanded(sectionId)) return;
        this.toggleSection(sectionId);
    }

    private toggleSection(sectionId: string): void {
        const section = this.options.sections.find(s => s.id === sectionId);
        if (!section) return;

        const expand = !this.isSectionExpanded(sectionId);
        this.applyExpanded(sectionId, expand);
        if (expand) section.onExpand?.();
    }

    private applyExpanded(sectionId: string, expanded: boolean): void {
        this.expanded.set(sectionId, expanded);
        this.query(`#${SIDE_PANEL_ID}-toggle-${sectionId}`)?.setAttribute('aria-expanded', String(expanded));
        const body = this.sectionBody(sectionId);
        if (body) body.hidden = !expanded;
    }

    private dismiss(reason: SidePanelDismissReason): void {
        const returnFocus = reason === 'outside' ? null : this.options.getReturnFocusTarget?.() ?? null;
        this.close();
        this.options.onDismiss?.(reason);
        returnFocus?.focus();
    }

    private panelElement(): HTMLElement | null {
        return this.query(`#${SIDE_PANEL_ID}`);
    }

    private sectionBody(sectionId: string): HTMLElement | null {
        return this.query(`#${SIDE_PANEL_ID}-section-${sectionId}`);
    }
}
