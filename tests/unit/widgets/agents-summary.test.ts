/**
 * Unit tests for AgentsSummaryWidget
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../src/utils/navigation.js', () => ({
  navigateTo: vi.fn().mockResolvedValue(undefined),
}));

import { AgentsSummaryWidget } from '../../../src/widgets/agents-summary.js';
import { setAgents } from '../../../src/state/agent-state.js';
import { navigateTo } from '../../../src/utils/navigation.js';
import { deriveAgentStatus } from '../../../src/utils/agent-utils.js';
import { mockAgents } from '../../mocks/agent-data.js';

describe('AgentsSummaryWidget', () => {
  let container: HTMLElement;
  let widget: AgentsSummaryWidget;

  beforeEach(() => {
    vi.clearAllMocks();
    setAgents([]);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    widget.destroy();
    container.remove();
  });

  it('shows online and total counts', () => {
    const online = mockAgents.filter(a => deriveAgentStatus(a.lastSeenAt) === 'online').length;
    widget = new AgentsSummaryWidget(container, mockAgents);
    widget.mount();

    expect(container.querySelector('.agents-summary__online')?.textContent).toBe(String(online));
    expect(container.querySelector('.agents-summary__total')?.textContent).toBe(`/${mockAgents.length}`);
    expect(container.querySelector('.agents-summary')?.getAttribute('aria-label'))
      .toContain(`${online} of ${mockAgents.length} online`);
  });

  it('reports "All online" when every agent is online', () => {
    const online = mockAgents.filter(a => deriveAgentStatus(a.lastSeenAt) === 'online');
    widget = new AgentsSummaryWidget(container, online);
    widget.mount();

    expect(container.querySelector('.agents-summary--ok')).toBeTruthy();
    expect(container.querySelector('.agents-summary__caption')?.textContent).toBe('All online');
  });

  it('reports offline count when some agents are offline', () => {
    widget = new AgentsSummaryWidget(container, mockAgents);
    widget.mount();

    const offline = mockAgents.filter(a => deriveAgentStatus(a.lastSeenAt) !== 'online').length;
    expect(container.querySelector('.agents-summary--degraded')).toBeTruthy();
    expect(container.querySelector('.agents-summary__caption')?.textContent).toBe(`${offline} offline`);
  });

  it('shows the empty state with no agents', () => {
    widget = new AgentsSummaryWidget(container, []);
    widget.mount();

    expect(container.querySelector('.agents-summary--empty')).toBeTruthy();
    expect(container.querySelector('.agents-summary__caption')?.textContent).toBe('No agents');
  });

  it('updates when agent state changes', () => {
    widget = new AgentsSummaryWidget(container, []);
    widget.mount();

    setAgents(mockAgents);

    expect(container.querySelector('.agents-summary__total')?.textContent).toBe(`/${mockAgents.length}`);
  });

  it('is a link to /agent and navigates via the router on click', () => {
    widget = new AgentsSummaryWidget(container, mockAgents);
    widget.mount();

    const link = container.querySelector<HTMLAnchorElement>('a.agents-summary')!;
    expect(link.getAttribute('href')).toBe('/agent');

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(navigateTo).toHaveBeenCalledWith('/agent', 'push');
  });
});
