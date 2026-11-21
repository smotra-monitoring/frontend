import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SidePanel, type SidePanelOptions } from '../../../src/components/side-panel.js';

describe('SidePanel', () => {
    let container: HTMLElement;
    let panel: SidePanel;
    let onExpand: ReturnType<typeof vi.fn>;
    let onDismiss: ReturnType<typeof vi.fn>;
    let returnTarget: HTMLButtonElement;
    let outside: HTMLButtonElement;
    let row: HTMLElement;

    const create = (overrides: Partial<SidePanelOptions> = {}) => {
        panel = new SidePanel(container, {
            sections: [
                { id: 'a', title: 'Section A', defaultExpanded: true },
                { id: 'b', title: 'Section B', defaultExpanded: false, onExpand: onExpand as () => void },
            ],
            onDismiss: onDismiss as SidePanelOptions['onDismiss'],
            getReturnFocusTarget: () => returnTarget,
            ...overrides,
        });
        panel.mount();
    };

    const aside = () => container.querySelector<HTMLElement>('#side-panel')!;
    const toggle = (id: string) => container.querySelector<HTMLButtonElement>(`[data-action="toggle-section"][data-section-id="${id}"]`)!;
    const body = (id: string) => container.querySelector<HTMLElement>(`#side-panel-section-${id}`)!;

    beforeEach(() => {
        onExpand = vi.fn();
        onDismiss = vi.fn();
        container = document.createElement('div');
        returnTarget = document.createElement('button');
        outside = document.createElement('button');
        row = document.createElement('tr');
        row.setAttribute('data-agent-row', '');
        document.body.append(container, returnTarget, outside, row);
        create();
    });

    afterEach(() => {
        panel.destroy();
        document.body.innerHTML = '';
    });

    describe('rendering', () => {
        it('renders a closed, inert complementary region with labelled sections', () => {
            expect(aside().tagName).toBe('ASIDE');
            expect(aside().getAttribute('aria-labelledby')).toBe('side-panel-title');
            expect(aside().hasAttribute('inert')).toBe(true);
            expect(aside().getAttribute('aria-hidden')).toBe('true');
            expect(panel.isOpen()).toBe(false);

            expect(toggle('a').getAttribute('aria-expanded')).toBe('true');
            expect(toggle('a').getAttribute('aria-controls')).toBe('side-panel-section-a');
            expect(body('a').getAttribute('role')).toBe('region');
            expect(body('a').getAttribute('aria-labelledby')).toBe(toggle('a').id);
            expect(body('b').hidden).toBe(true);
            expect(toggle('b').getAttribute('aria-expanded')).toBe('false');
        });

        it('has an accessible close button', () => {
            expect(container.querySelector('[data-action="close-panel"]')?.getAttribute('aria-label')).toBe('Close details');
        });

        it('announces title changes politely', () => {
            panel.setTitle('Agent 1');
            const title = container.querySelector('#side-panel-title')!;

            expect(title.textContent).toBe('Agent 1');
            expect(title.getAttribute('aria-live')).toBe('polite');
        });

        it('updates a single section body without touching the others', () => {
            panel.setSectionContent('a', '<p id="marker">hello</p>');
            const marker = container.querySelector('#marker')!;
            panel.setSectionContent('b', '<p>other</p>');

            expect(body('a').contains(marker)).toBe(true);
            expect(body('b').textContent).toBe('other');
        });
    });

    describe('show and close', () => {
        it('shows the panel, makes it interactive and focuses it', () => {
            panel.show();

            expect(panel.isOpen()).toBe(true);
            expect(aside().classList.contains('side-panel--open')).toBe(true);
            expect(aside().hasAttribute('inert')).toBe(false);
            expect(aside().getAttribute('aria-hidden')).toBe('false');
            expect(document.activeElement).toBe(aside());
        });

        it('hides the panel again without notifying onDismiss', () => {
            panel.show();
            panel.close();

            expect(panel.isOpen()).toBe(false);
            expect(aside().classList.contains('side-panel--open')).toBe(false);
            expect(aside().hasAttribute('inert')).toBe(true);
            expect(onDismiss).not.toHaveBeenCalled();
        });

        it('keeps the user\'s section state when reopened from closed', () => {
            panel.show();
            toggle('a').click();
            panel.expandSection('b');
            panel.close();
            panel.show();

            expect(panel.isSectionExpanded('a')).toBe(false);
            expect(body('a').hidden).toBe(true);
            expect(panel.isSectionExpanded('b')).toBe(true);
            expect(body('b').hidden).toBe(false);
            expect(toggle('b').getAttribute('aria-expanded')).toBe('true');
        });

        it('calls onExpand again for sections left expanded when reopened', () => {
            panel.show();
            panel.expandSection('b');
            panel.close();
            onExpand.mockClear();

            panel.show();

            expect(onExpand).toHaveBeenCalledTimes(1);
        });

        it('keeps section state while open (swap)', () => {
            panel.show();
            panel.expandSection('b');
            panel.close();
            panel.show();

            expect(panel.isSectionExpanded('b')).toBe(true);
        });
    });

    describe('sections', () => {
        it('toggles on click and keeps aria-expanded in sync', () => {
            panel.show();

            toggle('a').click();
            expect(body('a').hidden).toBe(true);
            expect(toggle('a').getAttribute('aria-expanded')).toBe('false');

            toggle('a').click();
            expect(body('a').hidden).toBe(false);
            expect(toggle('a').getAttribute('aria-expanded')).toBe('true');
        });

        it('calls onExpand each time a section is expanded, not when collapsed', () => {
            panel.show();

            toggle('b').click();
            toggle('b').click();
            toggle('b').click();

            expect(onExpand).toHaveBeenCalledTimes(2);
        });

        it('expandSection is a no-op for an expanded section', () => {
            panel.show();
            panel.expandSection('b');
            panel.expandSection('b');

            expect(onExpand).toHaveBeenCalledTimes(1);
        });

        it('calls onExpand for sections that start expanded when shown', () => {
            panel.destroy();
            create({ sections: [{ id: 'x', title: 'X', defaultExpanded: true, onExpand: onExpand as () => void }] });
            panel.show();

            expect(onExpand).toHaveBeenCalledTimes(1);
        });
    });

    describe('dismissal', () => {
        beforeEach(() => {
            panel.show();
        });

        it('closes via the close button and returns focus', () => {
            container.querySelector<HTMLButtonElement>('[data-action="close-panel"]')!.click();

            expect(panel.isOpen()).toBe(false);
            expect(onDismiss).toHaveBeenCalledWith('button');
            expect(document.activeElement).toBe(returnTarget);
        });

        it('closes on Escape and returns focus', () => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

            expect(panel.isOpen()).toBe(false);
            expect(onDismiss).toHaveBeenCalledWith('escape');
            expect(document.activeElement).toBe(returnTarget);
        });

        it('ignores Escape while a modal dialog is open', () => {
            const dialog = document.createElement('div');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
            document.body.appendChild(dialog);

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

            expect(panel.isOpen()).toBe(true);
        });

        it('ignores other keys', () => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

            expect(panel.isOpen()).toBe(true);
        });

        it('closes on an outside click without stealing focus', () => {
            outside.focus();
            outside.click();

            expect(panel.isOpen()).toBe(false);
            expect(onDismiss).toHaveBeenCalledWith('outside');
            expect(document.activeElement).toBe(outside);
        });

        it('stays open when clicking inside the panel', () => {
            body('a').click();
            toggle('a').click();

            expect(panel.isOpen()).toBe(true);
        });

        it('stays open when clicking an agent row', () => {
            row.click();

            expect(panel.isOpen()).toBe(true);
            expect(onDismiss).not.toHaveBeenCalled();
        });

        it('ignores clicks and Escape while closed', () => {
            panel.close();
            outside.click();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

            expect(onDismiss).not.toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        it('removes its document listeners on destroy', () => {
            panel.show();
            panel.destroy();

            outside.click();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

            expect(onDismiss).not.toHaveBeenCalled();
        });
    });
});
