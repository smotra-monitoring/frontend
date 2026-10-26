import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getAgents, smoothScrollTo } = vi.hoisted(() => ({
  getAgents: vi.fn(),
  smoothScrollTo: vi.fn(),
}));
vi.mock('../../../src/state/agent-state.js', () => ({ getAgents }));
vi.mock('../../../src/utils/dom-helpers.js', () => ({ smoothScrollTo }));

import { CommandPalette } from '../../../src/components/command-palette.js';
import { mockAgents } from '../../mocks/agent-data.js';

describe('CommandPalette', () => {
  let container: HTMLElement;
  let palette: CommandPalette;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    getAgents.mockReturnValue([
      { ...mockAgents[0], name: 'Agent " & <img src=x onerror=alert(1)>' },
    ]);
    palette = new CommandPalette(container);
    palette.mount();
    palette.show();
  });

  afterEach(() => {
    palette.destroy();
    container.remove();
    document.querySelector('[data-test-agent-row]')?.remove();
    vi.clearAllMocks();
  });

  it('keeps search text in the input value and highlights original text safely', () => {
    const query = '"';
    const input = container.querySelector<HTMLInputElement>(
      '.command-palette__input',
    )!;
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const renderedInput = container.querySelector<HTMLInputElement>(
      '.command-palette__input',
    )!;
    const label = container.querySelector('.command-palette__item-label')!;

    expect(renderedInput.value).toBe(query);
    expect(renderedInput.hasAttribute('onfocus')).toBe(false);
    expect(renderedInput.hasAttribute('autofocus')).toBe(false);
    expect(label.textContent).toBe('Agent " & <img src=x onerror=alert(1)>');
    expect(label.querySelector('mark')?.textContent).toBe('"');
    expect(label.querySelector('img')).toBeNull();
  });

  it('preserves ampersand matches when highlighting', () => {
    const input = container.querySelector<HTMLInputElement>(
      '.command-palette__input',
    )!;
    input.value = '&';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const label = container.querySelector('.command-palette__item-label')!;
    expect(label.textContent).toBe('Agent " & <img src=x onerror=alert(1)>');
    expect(label.querySelector('mark')?.textContent).toBe('&');
  });

  it('finds an agent row by its data value when the ID contains quotes', () => {
    const id = 'agent" data-injected="yes';
    getAgents.mockReturnValue([{ ...mockAgents[0], id, name: 'Target agent' }]);

    const agentRow = document.createElement('tr');
    agentRow.className = 'agent-states-row';
    agentRow.dataset.agentId = id;
    agentRow.setAttribute('data-test-agent-row', '');
    document.body.append(agentRow);

    const input = container.querySelector<HTMLInputElement>(
      '.command-palette__input',
    )!;
    input.value = 'Target';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    container
      .querySelector('.command-palette__item')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(smoothScrollTo).toHaveBeenCalledWith(agentRow);
  });
});
