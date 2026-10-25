import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';

vi.mock('../../../src/api/index.js', () => ({ postClaimAgent: vi.fn() }));
vi.mock('../../../src/auth/token-manager.js', () => ({
  getValidAccessToken: vi.fn().mockResolvedValue('token'),
}));
vi.mock('../../../src/state/agent-state.js', () => ({
  loadAgents: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../src/utils/navigation.js', () => ({
  navigateTo: vi.fn().mockResolvedValue(undefined),
}));

import { ClaimAgentModal } from '../../../src/components/claim-agent-modal.js';
import { postClaimAgent } from '../../../src/api/index.js';
import { loadAgents } from '../../../src/state/agent-state.js';
import { navigateTo } from '../../../src/utils/navigation.js';

const AGENT_ID = '0197f96c-b278-7f64-a32f-dae3cabe1ff0';
const CLAIM_CODE = 'ABC123XY';
const postMock = vi.mocked(postClaimAgent);

const ok = (message = 'Agent claimed') => ({ data: { agentId: AGENT_ID, status: 'claimed', message }, response: { status: 200 } });
const fail = (status: number, message = 'server said no') => ({ error: { error: 'X', message }, response: { status } });

describe('ClaimAgentModal', () => {
  let container: HTMLElement;
  let opener: HTMLButtonElement;
  let modal: ClaimAgentModal;
  let onClaimed: Mock<(message: string) => void>;
  let onFailed: Mock<(message: string) => void>;

  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => container.querySelector<T>(selector)!;
  const agentIdInput = () => $<HTMLInputElement>('#claim-agent-id');
  const codeInput = () => $<HTMLInputElement>('#claim-agent-code');
  const nameInput = () => $<HTMLInputElement>('#claim-agent-name');
  const status = () => $('#claim-modal-status');

  const fill = (agentId = AGENT_ID, code = CLAIM_CODE, name = '') => {
    agentIdInput().value = agentId;
    codeInput().value = code;
    nameInput().value = name;
  };
  const flush = () => vi.advanceTimersByTimeAsync(0);
  const submit = async () => {
    $<HTMLFormElement>('.claim-modal__form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    await flush();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/agent');
    Object.defineProperty(navigator, 'clipboard', { value: { readText: vi.fn() }, configurable: true });

    opener = document.createElement('button');
    container = document.createElement('div');
    document.body.append(opener, container);
    opener.focus();

    onClaimed = vi.fn();
    onFailed = vi.fn();
    modal = new ClaimAgentModal(container, { onClaimed, onFailed });
    modal.mount();
  });

  afterEach(() => {
    modal.destroy();
    opener.remove();
    container.remove();
    vi.useRealTimers();
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('renders nothing until shown, then an accessible dialog with focus on agent ID', () => {
    expect(container.innerHTML).toBe('');

    modal.show();

    const dialog = $('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toBe('Claim agent');
    expect(document.activeElement).toBe(agentIdInput());
  });

  describe('validation', () => {
    it('blocks submission and shows inline errors', async () => {
      modal.show();
      fill('nope', 'x');

      await submit();

      expect(postMock).not.toHaveBeenCalled();
      expect($('#claim-agent-id-error').textContent).toMatch(/valid UUID/);
      expect($('#claim-agent-code-error').textContent).toMatch(/4-64/);
      expect(agentIdInput().getAttribute('aria-invalid')).toBe('true');
      expect(agentIdInput().getAttribute('aria-describedby')).toContain('claim-agent-id-error');
      expect(document.activeElement).toBe(agentIdInput());
    });

    it('keeps typed values after a failed validation', async () => {
      modal.show();
      fill('nope', 'x', 'My agent');

      await submit();

      expect(agentIdInput().value).toBe('nope');
      expect(nameInput().value).toBe('My agent');
    });

    it('clears a field error when the user edits that field', async () => {
      modal.show();
      fill('nope', CLAIM_CODE);
      await submit();

      agentIdInput().value = AGENT_ID;
      agentIdInput().dispatchEvent(new Event('input', { bubbles: true }));

      expect(container.querySelector('#claim-agent-id-error')).toBeNull();
      expect(agentIdInput().getAttribute('aria-invalid')).toBe('false');
    });
  });

  describe('submit', () => {
    it('sends trimmed values with the optional name', async () => {
      postMock.mockResolvedValue(ok() as never);
      modal.show();
      fill(`  ${AGENT_ID} `, ` ${CLAIM_CODE} `, '  Prod 01 ');

      await submit();
      await flush();

      expect(postMock).toHaveBeenCalledTimes(1);
      expect(postMock.mock.calls[0][0].body).toEqual({ agentId: AGENT_ID, claimToken: CLAIM_CODE, name: 'Prod 01' });
    });

    it('omits the name when left empty', async () => {
      postMock.mockResolvedValue(ok() as never);
      modal.show();
      fill();

      await submit();
      await flush();

      expect(postMock.mock.calls[0][0].body.name).toBeUndefined();
    });

    it('disables the form and shows "Claiming…" while in flight', async () => {
      postMock.mockReturnValue(new Promise(() => {}) as never);
      modal.show();
      fill();

      await submit();

      expect(status().textContent).toContain('Claiming…');
      expect(agentIdInput().disabled).toBe(true);
      expect($<HTMLButtonElement>('.claim-modal__submit').disabled).toBe(true);
      expect($<HTMLButtonElement>('[data-paste-target="agentId"]').disabled).toBe(true);
      expect($<HTMLButtonElement>('[data-paste-target="claimCode"]').disabled).toBe(true);
    });

    it('supplies an auth callback that resolves the access token', async () => {
      postMock.mockResolvedValue(ok() as never);
      modal.show();
      fill();

      await submit();

      const auth = postMock.mock.calls[0][0].auth as () => Promise<string | undefined>;
      await expect(auth()).resolves.toBe('token');
    });
  });

  describe('errors', () => {
    it.each([
      [400, 'server said no', null],
      [401, 'session has expired', null],
      [403, 'invalid or has expired', 'claim-agent-code'],
      [404, 'No pending registration', 'claim-agent-id'],
      [409, 'already been claimed', 'claim-agent-id'],
      [500, 'server encountered an error', null],
    ])('maps %i to a message in the modal', async (code, text, flaggedId) => {
      postMock.mockResolvedValue(fail(code) as never);
      modal.show();
      fill();

      await submit();
      await flush();

      expect(status().textContent).toContain(text);
      expect(status().getAttribute('role')).toBe('alert');
      expect(onFailed).toHaveBeenCalledWith(expect.stringContaining(text));
      if (flaggedId) {
        expect(document.getElementById(flaggedId)!.getAttribute('aria-invalid')).toBe('true');
      }
    });

    it('shows a network message when the request fails without a response', async () => {
      postMock.mockResolvedValue({ error: new Error('offline'), response: undefined } as never);
      modal.show();
      fill();

      await submit();
      await flush();

      expect(status().textContent).toContain('Could not reach the server');
    });

    it('shows a network message when the request throws', async () => {
      postMock.mockRejectedValue(new TypeError('Failed to fetch'));
      modal.show();
      fill();

      await submit();
      await flush();

      expect(status().textContent).toContain('Could not reach the server');
    });

    it('keeps the form editable and allows a retry', async () => {
      postMock.mockResolvedValueOnce(fail(403) as never).mockResolvedValueOnce(ok() as never);
      modal.show();
      fill();

      await submit();
      await flush();

      expect(codeInput().disabled).toBe(false);
      expect(codeInput().value).toBe(CLAIM_CODE);

      await submit();
      await flush();

      expect(postMock).toHaveBeenCalledTimes(2);
      expect(status().textContent).toContain('Agent claimed');
    });
  });

  describe('success', () => {
    it('shows the server message and notifies the page', async () => {
      postMock.mockResolvedValue(ok('Welcome aboard') as never);
      modal.show();
      fill();

      await submit();
      await flush();

      expect(status().textContent).toContain('Welcome aboard');
      expect(onClaimed).toHaveBeenCalledWith('Welcome aboard');
    });

    it('falls back to a default message', async () => {
      postMock.mockResolvedValue(ok('') as never);
      modal.show();
      fill();

      await submit();
      await flush();

      expect(status().textContent).toContain('Agent claimed successfully.');
    });

    it('auto-closes after the delay, reloads agents and restores focus', async () => {
      postMock.mockResolvedValue(ok() as never);
      modal.show();
      fill();

      await submit();
      await flush();
      expect(container.querySelector('[role="dialog"]')).toBeTruthy();
      expect(loadAgents).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1500);

      expect(container.innerHTML).toBe('');
      expect(loadAgents).toHaveBeenCalledTimes(1);
      expect(navigateTo).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(opener);
    });

    it('navigates to /agent when opened from another route', async () => {
      window.history.replaceState({}, '', '/dashboard');
      postMock.mockResolvedValue(ok() as never);
      modal.show();
      fill();

      await submit();
      await flush();
      await vi.advanceTimersByTimeAsync(1500);

      expect(navigateTo).toHaveBeenCalledWith('/agent');
    });
  });

  describe('closing', () => {
    it('closes via the close button, Esc and overlay click', () => {
      modal.show();
      $('.command-palette__close').click();
      expect(container.innerHTML).toBe('');

      modal.show();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(container.innerHTML).toBe('');

      modal.show();
      $('.claim-modal__overlay').click();
      expect(container.innerHTML).toBe('');
    });

    it('does not close when clicking inside the dialog', () => {
      modal.show();
      $('.claim-modal').click();
      expect(container.querySelector('[role="dialog"]')).toBeTruthy();
    });

    it('closes mid-request and ignores the late response', async () => {
      let resolve!: (value: unknown) => void;
      postMock.mockReturnValue(new Promise((r) => (resolve = r)) as never);
      modal.show();
      fill();
      await submit();

      $('.command-palette__close').click();
      resolve(ok());
      await flush();
      await vi.advanceTimersByTimeAsync(2000);

      expect(container.innerHTML).toBe('');
      expect(onClaimed).not.toHaveBeenCalled();
      expect(loadAgents).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(opener);
    });

    it('cancels the auto-close timer when closed early', async () => {
      postMock.mockResolvedValue(ok() as never);
      modal.show();
      fill();
      await submit();
      await flush();

      $('.command-palette__close').click();
      await vi.advanceTimersByTimeAsync(2000);

      expect(loadAgents).not.toHaveBeenCalled();
    });

    it('clears the timer on destroy', async () => {
      postMock.mockResolvedValue(ok() as never);
      modal.show();
      fill();
      await submit();
      await flush();

      modal.destroy();
      await vi.advanceTimersByTimeAsync(2000);

      expect(loadAgents).not.toHaveBeenCalled();
    });

    it('resets state when reopened', async () => {
      postMock.mockResolvedValue(fail(409) as never);
      modal.show();
      fill(AGENT_ID, CLAIM_CODE, 'Name');
      await submit();
      await flush();

      modal.hide();
      modal.show();

      expect(agentIdInput().value).toBe('');
      expect(codeInput().value).toBe('');
      expect(nameInput().value).toBe('');
      expect(status().textContent).toBe('');
      expect(agentIdInput().getAttribute('aria-invalid')).toBe('false');
    });
  });

  describe('focus trap', () => {
    it('wraps Tab from the last to the first control and Shift+Tab back', () => {
      modal.show();
      const first = $('.command-palette__close');
      const last = $('.claim-modal__submit');

      last.focus();
      const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
      window.dispatchEvent(tab);
      expect(tab.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(first);

      const shiftTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
      window.dispatchEvent(shiftTab);
      expect(document.activeElement).toBe(last);
    });
  });

  describe('paste buttons', () => {
    const readText = () => vi.mocked(navigator.clipboard.readText);
    const paste = async (field: 'agentId' | 'claimCode') => {
      $(`[data-paste-target="${field}"]`).click();
      await flush();
    };

    it('has an accessible label on each button and none on the name field', () => {
      modal.show();

      expect($('[data-paste-target="agentId"]').getAttribute('aria-label')).toBe('Paste agent ID from clipboard');
      expect($('[data-paste-target="claimCode"]').getAttribute('aria-label')).toBe('Paste claim code from clipboard');
      expect(container.querySelectorAll('[data-paste-target]')).toHaveLength(2);
    });

    it('fills only its own field and focuses it', async () => {
      readText().mockResolvedValue(AGENT_ID);
      modal.show();
      codeInput().value = 'KEEP1234';

      await paste('agentId');

      expect(agentIdInput().value).toBe(AGENT_ID);
      expect(codeInput().value).toBe('KEEP1234');
      expect(nameInput().value).toBe('');
      expect(document.activeElement).toBe(agentIdInput());
      expect(postMock).not.toHaveBeenCalled();
    });

    it('trims whitespace', async () => {
      readText().mockResolvedValue(`  ${CLAIM_CODE}\n`);
      modal.show();

      await paste('claimCode');

      expect(codeInput().value).toBe(CLAIM_CODE);
    });

    it('validates immediately after pasting', async () => {
      readText().mockResolvedValue('not-a-uuid');
      modal.show();

      await paste('agentId');

      expect($('#claim-agent-id-error').textContent).toMatch(/valid UUID/);
      expect(container.querySelector('#claim-agent-code-error')).toBeNull();
    });

    it('clears a previous error when the pasted value is valid', async () => {
      modal.show();
      fill('nope', CLAIM_CODE);
      await submit();
      readText().mockResolvedValue(AGENT_ID);

      await paste('agentId');

      expect(container.querySelector('#claim-agent-id-error')).toBeNull();
      expect(agentIdInput().getAttribute('aria-invalid')).toBe('false');
    });

    it('shows an inline hint when the clipboard read is rejected', async () => {
      readText().mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
      modal.show();

      await paste('claimCode');

      expect($('#claim-agent-code-hint').textContent).toBe('Clipboard access denied. Paste with Ctrl+V instead.');
      expect(container.querySelector('#claim-agent-id-hint')).toBeNull();
      expect(codeInput().getAttribute('aria-describedby')).toContain('claim-agent-code-hint');
    });

    it('does not render the buttons without the Clipboard API', () => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });

      modal.show();

      expect(container.querySelector('[data-paste-target]')).toBeNull();
    });
  });
});
