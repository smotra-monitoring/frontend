/**
 * Unit tests for AgentStatesWidget component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentStatesWidget } from '../../../src/widgets/agent-states.js';
import { mockAgents } from '../../mocks/agent-data.js';
import { deriveAgentStatus } from '../../../src/utils/agent-utils.js';

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
            const expectedStatus = deriveAgentStatus(firstAgent.lastSeenAt);
            const firstBadge = badges[0];
            expect(firstBadge.classList.contains(`agent-status-badge--${expectedStatus}`)).toBe(true);
        });

        it('renders agent details in collapsed state by default', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const detailsRows = container.querySelectorAll('.agent-states-row__details');
            expect(detailsRows).toHaveLength(mockAgents.length);

            detailsRows.forEach(row => {
                expect(row.classList.contains('is-expanded')).toBe(false);
                expect(row.getAttribute('aria-hidden')).toBe('true');
            });
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
    });

    describe('Expand/Collapse (CSS-only)', () => {
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
        ])('toggles details exactly once when clicking %s', (selector) => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const row = container.querySelector<HTMLTableRowElement>('.agent-states-row')!;
            const button = row.querySelector<HTMLButtonElement>('.chevron-btn')!;
            const icon = button.querySelector('i')!;
            const detailsRow = document.getElementById(button.getAttribute('aria-controls')!)!;
            const target = container.querySelector<HTMLElement>(selector)!;

            target.click();

            expect(detailsRow.classList.contains('is-expanded')).toBe(true);
            expect(detailsRow.getAttribute('aria-hidden')).toBe('false');
            expect(button.getAttribute('aria-expanded')).toBe('true');
            expect(icon.classList.contains('fa-chevron-up')).toBe(true);
            expect(icon.classList.contains('fa-chevron-down')).toBe(false);
            expect(container.querySelectorAll('.agent-states-row__details.is-expanded')).toHaveLength(1);
            expect(container.querySelector('.agent-states-row')).toBe(row);

            target.click();

            expect(detailsRow.classList.contains('is-expanded')).toBe(false);
            expect(detailsRow.getAttribute('aria-hidden')).toBe('true');
            expect(button.getAttribute('aria-expanded')).toBe('false');
            expect(icon.classList.contains('fa-chevron-down')).toBe(true);
            expect(icon.classList.contains('fa-chevron-up')).toBe(false);
        });

        it('does not collapse when clicking expanded detail content', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            container.querySelector<HTMLElement>('.agent-states-row')!.click();
            const detailsRow = container.querySelector<HTMLElement>('.agent-states-row__details')!;
            detailsRow.querySelector<HTMLElement>('code')!.click();

            expect(detailsRow.classList.contains('is-expanded')).toBe(true);
            expect(detailsRow.getAttribute('aria-hidden')).toBe('false');
        });

        it('keeps row clicks and chevrons in sync after toggling all details', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const row = container.querySelector<HTMLTableRowElement>('.agent-states-row')!;
            const button = row.querySelector<HTMLButtonElement>('.chevron-btn')!;
            const detailsRow = document.getElementById(button.getAttribute('aria-controls')!)!;
            const toggleAll = container.querySelector<HTMLButtonElement>('[data-action="toggle-all"]')!;

            toggleAll.click();
            row.click();

            expect(detailsRow.classList.contains('is-expanded')).toBe(false);
            expect(button.getAttribute('aria-expanded')).toBe('false');
            expect(button.querySelector('.fa-chevron-down')).toBeTruthy();
            expect(container.querySelectorAll('.agent-states-row__details.is-expanded')).toHaveLength(mockAgents.length - 1);

            toggleAll.click();

            expect(detailsRow.classList.contains('is-expanded')).toBe(true);
            expect(button.getAttribute('aria-expanded')).toBe('true');
            expect(button.querySelector('.fa-chevron-up')).toBeTruthy();

            toggleAll.click();
            row.click();

            expect(detailsRow.classList.contains('is-expanded')).toBe(true);
            expect(button.getAttribute('aria-expanded')).toBe('true');
            expect(button.querySelector('.fa-chevron-up')).toBeTruthy();
            expect(container.querySelectorAll('.agent-states-row__details.is-expanded')).toHaveLength(1);
        });

        it('expands single agent details on chevron click', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const firstChevron = container.querySelector('[data-action="toggle-details"]') as HTMLButtonElement;
            const firstAgentId = firstChevron.dataset.agentId;
            const detailsRow = container.querySelector(`.agent-states-row__details[data-agent-id="${firstAgentId}"]`);

            expect(detailsRow?.classList.contains('is-expanded')).toBe(false);
            expect(firstChevron.getAttribute('aria-expanded')).toBe('false');

            // Click to expand
            firstChevron.click();

            expect(detailsRow?.classList.contains('is-expanded')).toBe(true);
            expect(firstChevron.getAttribute('aria-expanded')).toBe('true');
            expect(detailsRow?.getAttribute('aria-hidden')).toBe('false');
        });

        it('collapses expanded row on second chevron click', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const firstChevron = container.querySelector('[data-action="toggle-details"]') as HTMLButtonElement;
            const firstAgentId = firstChevron.dataset.agentId;
            const detailsRow = container.querySelector(`.agent-states-row__details[data-agent-id="${firstAgentId}"]`);

            // Expand
            firstChevron.click();
            expect(detailsRow?.classList.contains('is-expanded')).toBe(true);

            // Collapse
            firstChevron.click();
            expect(detailsRow?.classList.contains('is-expanded')).toBe(false);
            expect(firstChevron.getAttribute('aria-expanded')).toBe('false');
        });

        it('expands all rows when "Toggle All" is clicked and any row is collapsed', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const toggleAllButton = container.querySelector('[data-action="toggle-all"]') as HTMLButtonElement;
            const detailsRows = container.querySelectorAll('.agent-states-row__details');

            // Initially all collapsed
            detailsRows.forEach(row => {
                expect(row.classList.contains('is-expanded')).toBe(false);
            });

            // Click "Toggle All"
            toggleAllButton.click();

            // All should now be expanded
            detailsRows.forEach(row => {
                expect(row.classList.contains('is-expanded')).toBe(true);
                expect(row.getAttribute('aria-hidden')).toBe('false');
            });
        });

        it('collapses all rows when "Toggle All" is clicked and all rows are expanded', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const toggleAllButton = container.querySelector('[data-action="toggle-all"]') as HTMLButtonElement;
            const detailsRows = container.querySelectorAll('.agent-states-row__details');

            // Expand all first
            toggleAllButton.click();
            detailsRows.forEach(row => {
                expect(row.classList.contains('is-expanded')).toBe(true);
            });

            // Click "Toggle All" again to collapse
            toggleAllButton.click();

            // All should now be collapsed
            detailsRows.forEach(row => {
                expect(row.classList.contains('is-expanded')).toBe(false);
                expect(row.getAttribute('aria-hidden')).toBe('true');
            });
        });

        it('expands all when some rows are expanded and some are collapsed', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const toggleAllButton = container.querySelector('[data-action="toggle-all"]') as HTMLButtonElement;
            const chevronButtons = container.querySelectorAll('[data-action="toggle-details"]');
            const detailsRows = container.querySelectorAll('.agent-states-row__details');

            // Expand first row only
            (chevronButtons[0] as HTMLButtonElement).click();
            expect(detailsRows[0].classList.contains('is-expanded')).toBe(true);
            expect(detailsRows[1].classList.contains('is-expanded')).toBe(false);

            // Click "Toggle All" - should expand all since not all are expanded
            toggleAllButton.click();

            detailsRows.forEach(row => {
                expect(row.classList.contains('is-expanded')).toBe(true);
            });
        });
    });

    describe('Agent details content', () => {
        it('check agent details fields', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const firstChevron = container.querySelector('[data-action="toggle-details"]') as HTMLButtonElement;

            const firstAgentId = firstChevron.dataset.agentId;
            const detailsRow = container.querySelector(`.agent-states-row__details[data-agent-id="${firstAgentId}"]`);
            const detailsContent = detailsRow?.textContent || '';

            // Should contain key agent fields
            expect(detailsContent).toContain('Agent ID');
            expect(detailsContent).toContain('Section ID');
            expect(detailsContent).toContain('Agent Version');
            expect(detailsContent).toContain('Config Version');
        });

        it('IP addresses in agent details', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const firstChevron = container.querySelector('[data-action="toggle-details"]') as HTMLButtonElement;

            const firstAgentId = firstChevron.dataset.agentId;
            const detailsRow = container.querySelector(`.agent-states-row__details[data-agent-id="${firstAgentId}"]`);

            const agent = mockAgents.find(a => a.id === firstAgentId);
            if (agent?.ipAddresses && agent.ipAddresses.length > 0) {
                const ipList = detailsRow?.querySelector('.agent-details__ip-list');
                expect(ipList).toBeTruthy();
                expect(ipList?.children.length).toBe(agent.ipAddresses.length);
            }
        });
    });

    describe('Accessibility', () => {
        it('sets correct ARIA attributes on expandable rows', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const chevronButtons = container.querySelectorAll('[data-action="toggle-details"]');
            const detailsRows = container.querySelectorAll('.agent-states-row__details');

            chevronButtons.forEach((button, index) => {
                expect(button.getAttribute('aria-expanded')).toBe('false');
                expect(button.getAttribute('aria-controls')).toBe(detailsRows[index].id);
                expect(detailsRows[index].getAttribute('aria-hidden')).toBe('true');
            });
        });

        it('updates ARIA attributes when expanding', () => {
            widget = new AgentStatesWidget(container, mockAgents);
            widget.mount();

            const firstChevron = container.querySelector('[data-action="toggle-details"]') as HTMLButtonElement;
            const firstAgentId = firstChevron.dataset.agentId;
            const detailsRow = container.querySelector(`.agent-states-row__details[data-agent-id="${firstAgentId}"]`);

            firstChevron.click();

            expect(firstChevron.getAttribute('aria-expanded')).toBe('true');
            expect(detailsRow?.getAttribute('aria-hidden')).toBe('false');
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

    describe('XSS Protection', () => {
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
});
