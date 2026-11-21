/**
 * Unit tests for AgentStatesWidget component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentStatesWidget } from '../../../src/widgets/agent-states.js';
import { mockAgents } from '../../mocks/agent-data.js';
import { deriveAgentStatus } from '../../../src/utils/agent-utils.js';
import { closeAgentDetails, getAgentDetailsPanelState } from '../../../src/state/agent-details-panel-state.js';

describe('AgentStatesWidget', () => {
    let container: HTMLElement;
    let widget: AgentStatesWidget;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (widget) {
            widget.destroy();
        }
        closeAgentDetails();
        document.body.removeChild(container);
    });

    describe('Rendering', () => {
        it('renders widget with agent count', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const title = container.querySelector('.agent-states-widget__title h2');
            expect(title?.textContent).toBe('Agent States');

            const count = container.querySelector('.agent-states-widget__count');
            expect(count?.textContent?.trim()).toBe(mockAgents.length.toString());
        });

        it('renders table with correct number of rows', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const rows = container.querySelectorAll('.agent-states-row');
            expect(rows).toHaveLength(mockAgents.length);
        });

        it('renders empty state when no agents', () => {
            widget = new AgentStatesWidget(container, []);
            widget.mount();

            const empty = container.querySelector('.agent-states-widget__empty');
            expect(empty).toBeTruthy();
            expect(empty?.textContent).toContain('No agents found');
        });

        it('renders loading state', () => {
            widget = new AgentStatesWidget(container, []);
            widget.mount();
            widget.setLoading(true);

            const loading = container.querySelector('.agent-states-widget__loading');
            expect(loading).toBeTruthy();
            expect(loading?.textContent).toContain('Loading');
        });

        it('renders status badges for each agent', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const badges = container.querySelectorAll('.agent-status-badge');
            expect(badges).toHaveLength(mockAgents.length);

            // Check first agent has correct status badge
            const firstAgent = mockAgents[0];
            const expectedStatus = deriveAgentStatus(firstAgent.last_seen_at);
            const firstBadge = badges[0];
            expect(firstBadge.classList.contains(`agent-status-badge--${expectedStatus}`)).toBe(true);
        });

        it('renders no inline detail rows and no Toggle All button', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            expect(container.querySelectorAll('tbody tr')).toHaveLength(mockAgents.length);
            expect(container.querySelector('[data-action="toggle-all"]')).toBeNull();
        });

        it('renders the Desired version as a labelled button', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const row = container.querySelector<HTMLElement>('.agent-states-row')!;
            const agent = mockAgents.find(a => a.id === row.dataset.agentId)!;
            const button = row.querySelector<HTMLButtonElement>('[data-action="show-config"]')!;

            expect(button.tagName).toBe('BUTTON');
            expect(button.type).toBe('button');
            expect(button.textContent?.trim()).toBe(String(agent.config_version_desired));
            expect(button.getAttribute('aria-label')).toBe(
                `Show desired configuration, version ${agent.config_version_desired}, for ${agent.name}`
            );
            expect(row.querySelector('.agent-states-row__config-version')?.textContent).toContain(
                `${agent.config_version_current ?? 'N/A'} /`
            );
        });
    });

    describe('Sorting', () => {
        it('sorts by name ascending by default', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const rows = container.querySelectorAll('.agent-states-row');
            const names = Array.from(rows).map(row =>
                row.querySelector('.agent-states-row__name')?.textContent?.trim()
            );

            const sortedNames = [...names].sort();
            expect(names).toEqual(sortedNames);
        });

        it('toggles sort direction on header click', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const nameSortButton = container.querySelector('[data-sort-field="name"]') as HTMLButtonElement;
            expect(nameSortButton).toBeTruthy();

            // Initial sort is ascending
            expect(nameSortButton.getAttribute('aria-sort')).toBe('ascending');

            // Click to toggle to descending
            nameSortButton.click();

            // Re-render happens, query again
            const updatedSortButton = container.querySelector('[data-sort-field="name"]') as HTMLButtonElement;
            expect(updatedSortButton.getAttribute('aria-sort')).toBe('descending');
        });

        it('shows active sort indicator on sorted column', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const nameSortButton = container.querySelector('[data-sort-field="name"]') as HTMLButtonElement;
            const indicator = nameSortButton?.querySelector('.sort-indicator--active');
            expect(indicator).toBeTruthy();

            // Other columns should have inactive indicator
            const statusSortButton = container.querySelector('[data-sort-field="status"]') as HTMLButtonElement;
            const statusIndicator = statusSortButton?.querySelector('.sort-indicator--inactive');
            expect(statusIndicator).toBeTruthy();
        });

        it.each([
            'agentVersion',
            'configVersionCurrent',
            'configVersionDesired',
        ])('sorts by %s on header click and toggles direction', (field) => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const button = () => container.querySelector(`[data-sort-field="${field}"]`) as HTMLButtonElement;
            expect(button().getAttribute('aria-sort')).toBe('none');

            button().click();
            expect(button().getAttribute('aria-sort')).toBe('ascending');
            expect(button().querySelector('.sort-indicator--active')).toBeTruthy();

            button().click();
            expect(button().getAttribute('aria-sort')).toBe('descending');
        });

        it('orders rows by agent version', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            (container.querySelector('[data-sort-field="agentVersion"]') as HTMLButtonElement).click();

            const versions = Array.from(container.querySelectorAll('.agent-states-row__agent-version'))
                .map(cell => cell.textContent?.trim() ?? '');
            expect(versions).toEqual([...versions].sort());
        });
    });

    describe('Opening the details side panel', () => {
        it.each([
            '.agent-states-row',
            '.agent-states-row__name',
            '.agent-states-row__status',
            '.status-label',
            '.agent-states-row__last-seen',
            '.agent-states-row__actions',
            '.chevron-btn',
            '.chevron-btn .icon',
            '.chevron-btn i',
        ])('opens the panel for the row exactly once when clicking %s', (selector) => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const row = container.querySelector<HTMLTableRowElement>('.agent-states-row')!;
            const before = getAgentDetailsPanelState().configRequest;

            container.querySelector<HTMLElement>(selector)!.click();

            expect(getAgentDetailsPanelState()).toEqual({ agentId: row.dataset.agentId, configRequest: before });
        });

        it('opens the panel with the config section requested from the Desired button', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const row = container.querySelector<HTMLTableRowElement>('.agent-states-row')!;
            const before = getAgentDetailsPanelState().configRequest;

            row.querySelector<HTMLButtonElement>('[data-action="show-config"]')!.click();

            expect(getAgentDetailsPanelState()).toEqual({ agentId: row.dataset.agentId, configRequest: before + 1 });
        });

        it('swaps the panel to another row', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const rows = container.querySelectorAll<HTMLTableRowElement>('.agent-states-row');
            rows[0]!.click();
            rows[1]!.click();

            expect(getAgentDetailsPanelState().agentId).toBe(rows[1]!.dataset.agentId);
        });

        it('does not open the panel from header sort buttons', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            container.querySelector<HTMLButtonElement>('[data-sort-field="configVersionDesired"]')!.click();

            expect(getAgentDetailsPanelState().agentId).toBeNull();
        });
    });

    describe('Selected row', () => {
        it('marks only the open agent\'s row and its chevron, without re-rendering rows', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const rows = container.querySelectorAll<HTMLTableRowElement>('.agent-states-row');
            const chevron = rows[1]!.querySelector<HTMLButtonElement>('.chevron-btn')!;
            chevron.focus();

            chevron.click();

            expect(rows[1]!.classList.contains('agent-states-row--selected')).toBe(true);
            expect(rows[1]!.getAttribute('aria-current')).toBe('true');
            expect(chevron.getAttribute('aria-expanded')).toBe('true');
            expect(rows[0]!.classList.contains('agent-states-row--selected')).toBe(false);
            expect(rows[0]!.hasAttribute('aria-current')).toBe(false);
            expect(container.querySelectorAll('.agent-states-row')[1]).toBe(rows[1]);
            expect(document.activeElement).toBe(chevron);
        });

        it('moves the highlight on a swap and clears it on close', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const rows = container.querySelectorAll<HTMLTableRowElement>('.agent-states-row');
            rows[0]!.click();
            rows[1]!.click();

            expect(container.querySelectorAll('.agent-states-row--selected')).toHaveLength(1);
            expect(rows[1]!.classList.contains('agent-states-row--selected')).toBe(true);

            closeAgentDetails();

            expect(container.querySelectorAll('.agent-states-row--selected')).toHaveLength(0);
            expect(container.querySelectorAll('[aria-current]')).toHaveLength(0);
            expect(rows[1]!.querySelector('.chevron-btn')!.getAttribute('aria-expanded')).toBe('false');
        });

        it('keeps the highlight when the table re-renders (sorting)', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const agentId = container.querySelector<HTMLTableRowElement>('.agent-states-row')!.dataset.agentId!;
            container.querySelector<HTMLTableRowElement>('.agent-states-row')!.click();
            container.querySelector<HTMLButtonElement>('[data-sort-field="name"]')!.click();

            const selected = container.querySelectorAll<HTMLTableRowElement>('.agent-states-row--selected');
            expect(selected).toHaveLength(1);
            expect(selected[0]!.dataset.agentId).toBe(agentId);
            expect(selected[0]!.getAttribute('aria-current')).toBe('true');
        });
    });

    describe('Accessibility', () => {
        it('sets correct ARIA attributes on the panel triggers', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const chevronButtons = container.querySelectorAll('[data-action="toggle-details"]');
            expect(chevronButtons).toHaveLength(mockAgents.length);

            chevronButtons.forEach(button => {
                expect(button.getAttribute('aria-expanded')).toBe('false');
                expect(button.getAttribute('aria-controls')).toBe('side-panel');
                expect(button.getAttribute('aria-label')).toMatch(/^Show details for /);
                expect(button.querySelector('i')?.getAttribute('aria-hidden')).toBe('true');
            });
        });

        it('updates aria-expanded when the panel opens', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const firstChevron = container.querySelector('[data-action="toggle-details"]') as HTMLButtonElement;

            firstChevron.click();

            expect(firstChevron.getAttribute('aria-expanded')).toBe('true');
        });

        it('has aria-sort attributes on sortable headers', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const sortButtons = container.querySelectorAll('.sort-btn');

            sortButtons.forEach(button => {
                const ariaSort = button.getAttribute('aria-sort');
                expect(['none', 'ascending', 'descending']).toContain(ariaSort);
            });
        });
    });

    describe('XSS Protection (security check)', () => {
        it('escapes HTML in agent names', () => {
            const maliciousAgent = {
                ...mockAgents[0],
                name: '<script>alert("xss")</script>',
            };

            widget = new AgentStatesWidget(container, [maliciousAgent]);
            widget.mount();

            const nameCell = container.querySelector('.agent-states-row__name');
            expect(nameCell?.innerHTML).not.toContain('<script>');
            expect(nameCell?.textContent).toContain('\<script\>'); // Should render as text, not HTML
        });
    });

    describe('HTML Escaping (security check)', () => {
        it('does not let an agent name break out of an attribute', () => {
            const name = 'x" autofocus onfocus="alert(1)';
            const maliciousAgent = { ...mockAgents[0], name };

            widget = new AgentStatesWidget(container, [maliciousAgent]);
            widget.mount();

            expect(container.querySelector('[autofocus], [onfocus]')).toBeNull();
            const toggle = container.querySelector('[data-action="toggle-details"]');
            expect(toggle?.getAttribute('aria-label')).toBe(`Show details for ${name}`);
            const desired = container.querySelector('[data-action="show-config"]');
            expect(desired?.getAttribute('aria-label')).toContain(name);

            const nameCell = container.querySelector('.agent-states-row__name');
            expect(nameCell?.textContent).toContain(name);
        });
    });
});
