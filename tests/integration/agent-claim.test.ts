/**
 * Integration test: claiming an agent from the Agents page
 * open modal -> submit -> success -> auto-close -> agents list reloads
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('../../src/auth/auth-guard.js', () => ({
  protectRoute: vi.fn().mockResolvedValue(true),
  canAccessPublicRoute: vi.fn().mockReturnValue({ allowed: true }),
}));

const AGENT_ID = '0197f96c-b278-7f64-a32f-dae3cabe1ff0';

vi.mock('../../src/api/index.js', async (importOriginal) => {
  const { mockAgents } = await import('../mocks/agent-data.js');
  const actual = await importOriginal<typeof import('../../src/api/index.js')>();
  const page = (agents: unknown[]) => ({
    data: {
      agents,
      pagination: { page: 1, page_size: 100, total_items: agents.length, total_pages: 1, has_next: false },
    },
  });
  return {
    ...actual,
    listAgents: vi.fn()
      .mockResolvedValueOnce(page(mockAgents.slice(0, 1)))
      .mockResolvedValue(page(mockAgents)),
    postClaimAgent: vi.fn().mockResolvedValue({
      data: { agentId: '0197f96c-b278-7f64-a32f-dae3cabe1ff0', status: 'claimed', message: 'Agent claimed' },
      response: { status: 200 },
    }),
  };
});

import { initializeRouter } from '../../src/pages/router.js';
import { listAgents, postClaimAgent } from '../../src/api/index.js';
import { mockAgents } from '../mocks/agent-data.js';

describe('Agent claim workflow (Integration)', () => {
  let appRoot: HTMLElement;

  beforeAll(async () => {
    Element.prototype.scrollIntoView = vi.fn();
    window.history.replaceState({}, '', '/agent');
    appRoot = document.createElement('div');
    appRoot.id = 'app';
    document.body.appendChild(appRoot);
    await initializeRouter(appRoot);
    await vi.waitFor(() => expect(appRoot.querySelectorAll('.agent-states-row')).toHaveLength(1));
  });

  afterAll(() => {
    vi.useRealTimers();
    appRoot.remove();
  });

  it('claims an agent and refreshes the list without a page reload', async () => {
    expect(mockAgents.length).toBeGreaterThan(1);
    const claimButton = appRoot.querySelector<HTMLButtonElement>('#claim-agent-button')!;
    claimButton.focus();
    claimButton.click();

    const dialog = appRoot.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();

    const agentIdInput = appRoot.querySelector<HTMLInputElement>('#claim-agent-id')!;
    const codeInput = appRoot.querySelector<HTMLInputElement>('#claim-agent-code')!;
    const nameInput = appRoot.querySelector<HTMLInputElement>('#claim-agent-name')!;
    agentIdInput.value = AGENT_ID;
    codeInput.value = 'ABC123XY';
    nameInput.value = 'Production Server 01';

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    appRoot.querySelector<HTMLButtonElement>('.claim-modal__submit')!.click();

    await vi.waitFor(() => {
      expect(appRoot.querySelector('#claim-modal-status')?.textContent).toContain('Agent claimed');
    });

    expect(postClaimAgent).toHaveBeenCalledTimes(1);
    expect(vi.mocked(postClaimAgent).mock.calls[0][0].body).toEqual({
      agentId: AGENT_ID,
      claimToken: 'ABC123XY',
      name: 'Production Server 01',
    });
    expect(appRoot.querySelector('.toast--success')).toBeTruthy();
    expect(vi.mocked(listAgents)).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1500);
    vi.useRealTimers();

    expect(appRoot.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(appRoot.querySelector('#claim-agent-button'));

    await vi.waitFor(() => {
      expect(appRoot.querySelectorAll('.agent-states-row')).toHaveLength(mockAgents.length);
    });
    expect(vi.mocked(listAgents)).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe('/agent');
  });
});
