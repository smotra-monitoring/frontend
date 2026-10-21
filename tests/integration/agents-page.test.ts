/**
 * Integration test: navigating to `/agent` renders the AgentsPage with the AgentStatesWidget
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';

vi.mock('../../src/auth/auth-guard.js', () => ({
  protectRoute: vi.fn().mockResolvedValue(true),
  canAccessPublicRoute: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('../../src/api/index.js', async (importOriginal) => {
  const { mockAgents } = await import('../mocks/agent-data.js');
  const actual = await importOriginal<typeof import('../../src/api/index.js')>();
  return {
    ...actual,
    listAgents: vi.fn().mockResolvedValue({
      data: {
        agents: mockAgents,
        pagination: { page: 1, page_size: 100, total_items: mockAgents.length, total_pages: 1, has_next: false },
      },
    }),
  };
});

import { initializeRouter, navigate } from '../../src/pages/router.js';
import { protectRoute } from '../../src/auth/auth-guard.js';
import { mockAgents } from '../mocks/agent-data.js';

describe('Agents page routing (Integration)', () => {
  let appRoot: HTMLElement;

  beforeAll(async () => {
    // jsdom does not implement scrollIntoView (used by router's smoothScrollTo)
    Element.prototype.scrollIntoView = vi.fn();
    window.history.replaceState({}, '', '/agent');
    appRoot = document.createElement('div');
    appRoot.id = 'app';
    document.body.appendChild(appRoot);
    await initializeRouter(appRoot);
  });

  it('renders AgentStatesWidget when loading /agent directly', async () => {
    await vi.waitFor(() => {
      expect(appRoot.querySelectorAll('.agent-states-row')).toHaveLength(mockAgents.length);
    });

    expect(appRoot.querySelector('.agents-page')).toBeTruthy();
    expect(appRoot.querySelector('.agent-states-widget__title h2')?.textContent).toBe('Agent States');
  });

  it('highlights the Agents sidebar link as active', () => {
    const active = appRoot.querySelector('.sidebar__link--active');
    expect(active?.getAttribute('data-route')).toBe('/agent');
  });

  it('navigates from /dashboard to /agent via the router', async () => {
    await navigate('/dashboard');
    expect(appRoot.querySelector('.agents-page')).toBeNull();
    expect(window.location.pathname).toBe('/dashboard');

    await navigate('/agent');
    expect(protectRoute).toHaveBeenCalledWith('/agent');
    expect(window.location.pathname).toBe('/agent');
    expect(appRoot.querySelector('.agents-page .agent-states-widget')).toBeTruthy();
  });
});
