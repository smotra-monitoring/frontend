/**
 * Unit tests for AgentsPage and its `/agent` route registration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../src/state/agent-state.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/state/agent-state.js')>();
  return { ...actual, loadAgents: vi.fn().mockResolvedValue(undefined) };
});

import { AgentsPage } from '../../../src/pages/agents.js';
import { ROUTES_for_tests } from '../../../src/pages/router.js';
import { setAgents, loadAgents } from '../../../src/state/agent-state.js';
import { mockAgents } from '../../mocks/agent-data.js';

describe('AgentsPage', () => {
  let container: HTMLElement;
  let page: AgentsPage | null = null;

  beforeEach(() => {
    setAgents(mockAgents);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    page?.destroy();
    page = null;
    container.remove();
  });

  it('renders the page title and main landmark', () => {
    page = new AgentsPage(container);
    page.mount();

    expect(container.querySelector('main.dashboard__main')).toBeTruthy();
    expect(container.querySelector('.dashboard__title')?.textContent).toBe('Agents');
  });

  it('mounts the AgentStatesWidget with current agents', () => {
    page = new AgentsPage(container);
    page.mount();

    expect(container.querySelector('#agent-states-container .agent-states-widget')).toBeTruthy();
    expect(container.querySelectorAll('.agent-states-row')).toHaveLength(mockAgents.length);
  });

  it('loads agents on mount', () => {
    page = new AgentsPage(container);
    page.mount();

    expect(loadAgents).toHaveBeenCalledTimes(1);
  });

  it('cleans up child components on destroy', () => {
    page = new AgentsPage(container);
    page.mount();
    page.destroy();

    expect(container.innerHTML).toBe('');
    expect(page.isDestroyed()).toBe(true);
  });
});

describe('Router: /agent route', () => {
  it('registers /agent as a private route rendering AgentsPage', () => {
    const route = ROUTES_for_tests.find(r => r.path === '/agent');

    expect(route).toBeDefined();
    expect(route!.component).toBe(AgentsPage);
    expect(route!.strategy).toBe('private');
  });
});
