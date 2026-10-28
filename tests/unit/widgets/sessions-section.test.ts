import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../src/services/session-service.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../src/services/session-service.js')>();
    return {
        ...actual,
        fetchSessions: vi.fn(),
        terminateSession: vi.fn(),
        terminateOtherSessions: vi.fn(),
    };
});

import { SettingsSessions } from '../../../src/widgets/settings-sessions.js';
import {
    fetchSessions,
    terminateSession,
    terminateOtherSessions,
    SessionServiceError,
} from '../../../src/services/session-service.js';
import { mockSessions } from '../../mocks/session-data.js';

describe('SessionsSection', () => {
    let container: HTMLElement;
    let section: SettingsSessions | null = null;
    const onSuccess = vi.fn();
    const onError = vi.fn();

    async function mountSection(): Promise<void> {
        section = new SettingsSessions(container, { onSuccess, onError });
        section.mount();
        await vi.waitFor(() => expect(container.querySelector('.session-row')).toBeTruthy());
    }

    const rows = () => Array.from(container.querySelectorAll<HTMLElement>('.session-row'));
    const rowButton = (index: number) => rows()[index]!.querySelector<HTMLButtonElement>('[data-action="terminate"]')!;
    const terminateAllButton = () => container.querySelector<HTMLButtonElement>('[data-action="terminate-all"]')!;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetchSessions).mockResolvedValue(mockSessions);
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        section?.destroy();
        section = null;
        container.remove();
        vi.useRealTimers();
    });

    it('renders one row per session', async () => {
        await mountSection();
        expect(rows()).toHaveLength(mockSessions.length);
        expect(container.querySelector('[data-role="count"]')?.textContent).toBe('3');
    });

    it('shows every field of the session schema', async () => {
        await mountSection();
        const [current, other, minimal] = rows();
        const first = current!.textContent!;

        expect(first).toContain('Firefox on Linux');
        expect(first).toContain('203.0.113.10');
        expect(first).toContain('google');
        expect(first).toContain(mockSessions[0]!.id);
        expect(first).toContain('Mozilla/5.0 (X11; Linux x86_64; rv:128.0)');
        ['IP address', 'Provider', 'Created', 'Last used', 'Expires', 'Session ID', 'User agent'].forEach(label =>
            expect(first).toContain(label)
        );
        expect(current!.querySelectorAll('time')).toHaveLength(3);
        expect(other!.textContent).toContain('Safari on iOS');
        expect(other!.textContent).toContain('okta');
        expect(minimal!.textContent).toContain('Unknown device');
        expect(minimal!.querySelectorAll('.session-row__field dd')[0]!.textContent).toBe('—');
    });

    it('flags the current session and disables its terminate button', async () => {
        await mountSection();
        expect(rows()[0]!.classList.contains('session-row--current')).toBe(true);
        expect(rows()[0]!.textContent).toContain('This device');
        expect(rowButton(0).disabled).toBe(true);
        expect(rowButton(1).disabled).toBe(false);
    });

    it('puts the terminate button last in each row and Terminate All before the list', async () => {
        await mountSection();
        const row = rows()[1]!;
        expect(row.lastElementChild!.contains(rowButton(1))).toBe(true);

        const all = terminateAllButton();
        const list = container.querySelector('.session-list')!;
        expect(all.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(all.textContent).toContain('Terminate All');
    });

    it('is open by default and uses native details for folding', async () => {
        await mountSection();
        const details = container.querySelector<HTMLDetailsElement>('details.settings-section')!;
        expect(details.open).toBe(true);
        expect(details.querySelector('summary')).toBeTruthy();
    });

    it('keeps the folded state across sessions fetch (not the page reload)', async () => {
        await mountSection();
        const details = container.querySelector<HTMLDetailsElement>('details.settings-section')!;
        details.open = false;

        vi.mocked(fetchSessions).mockResolvedValue([mockSessions[0]!]);
        await section!.load();

        expect(container.querySelector('details.settings-section')).toBe(details);
        expect(details.open).toBe(false);
        expect(rows()).toHaveLength(1);
    });

    it('requires a second click to terminate a session', async () => {
        vi.mocked(terminateSession).mockResolvedValue(undefined);
        await mountSection();

        rowButton(1).click();
        expect(terminateSession).not.toHaveBeenCalled();
        expect(rowButton(1).dataset.confirming).toBe('true');
        expect(rowButton(1).textContent).toContain('Confirm?');

        vi.mocked(fetchSessions).mockResolvedValue([mockSessions[0]!, mockSessions[2]!]);
        rowButton(1).click();

        expect(terminateSession).toHaveBeenCalledWith(mockSessions[1]!.id);
        await vi.waitFor(() => expect(rows()).toHaveLength(2));
        expect(onSuccess).toHaveBeenCalledWith('Session terminated.');
    });

    it('disarms the confirmation after a timeout', async () => {
        await mountSection();
        vi.useFakeTimers();

        rowButton(1).click();
        expect(rowButton(1).dataset.confirming).toBe('true');

        vi.advanceTimersByTime(4000);
        expect(rowButton(1).dataset.confirming).toBeUndefined();
        expect(rowButton(1).textContent).toContain('Terminate');
        expect(terminateSession).not.toHaveBeenCalled();
    });

    it('disarms the confirmation when focus leaves the button', async () => {
        await mountSection();
        const button = rowButton(1);

        button.click();
        button.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

        expect(button.dataset.confirming).toBeUndefined();
    });

    it('terminates all other sessions with two clicks', async () => {
        vi.mocked(terminateOtherSessions).mockResolvedValue(2);
        await mountSection();

        terminateAllButton().click();
        expect(terminateOtherSessions).not.toHaveBeenCalled();

        vi.mocked(fetchSessions).mockResolvedValue([mockSessions[0]!]);
        terminateAllButton().click();

        expect(terminateOtherSessions).toHaveBeenCalledTimes(1);
        await vi.waitFor(() => expect(rows()).toHaveLength(1));
        expect(onSuccess).toHaveBeenCalledWith('Terminated 2 other sessions.');
        expect(terminateAllButton().disabled).toBe(true);
    });

    it('disables Terminate All when only the current session exists', async () => {
        vi.mocked(fetchSessions).mockResolvedValue([mockSessions[0]!]);
        await mountSection();
        expect(terminateAllButton().disabled).toBe(true);
    });

    it('reports a failed terminate and reloads the list', async () => {
        vi.mocked(terminateSession).mockRejectedValue(new SessionServiceError('denied', 403));
        await mountSection();

        rowButton(1).click();
        rowButton(1).click();

        await vi.waitFor(() => expect(onError).toHaveBeenCalledWith('denied'));
        await vi.waitFor(() => expect(fetchSessions).toHaveBeenCalledTimes(2));
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it('treats 404 on terminate as already terminated', async () => {
        vi.mocked(terminateSession).mockRejectedValue(new SessionServiceError('gone', 404));
        await mountSection();

        rowButton(1).click();
        rowButton(1).click();

        await vi.waitFor(() => expect(fetchSessions).toHaveBeenCalledTimes(2));
        expect(onError).not.toHaveBeenCalled();
    });

    it('shows an error when loading fails', async () => {
        vi.mocked(fetchSessions).mockRejectedValue(new Error('server down'));
        section = new SettingsSessions(container, { onSuccess, onError });
        section.mount();

        await vi.waitFor(() => expect(container.querySelector('[role="alert"]')?.textContent).toBe('server down'));
        expect(onError).toHaveBeenCalledWith('server down');
        expect(terminateAllButton().disabled).toBe(true);
    });

    it('shows an empty message when there are no sessions', async () => {
        vi.mocked(fetchSessions).mockResolvedValue([]);
        section = new SettingsSessions(container);
        section.mount();

        await vi.waitFor(() => expect(container.textContent).toContain('No active sessions.'));
    });

    it('escapes untrusted values', async () => {
        vi.mocked(fetchSessions).mockResolvedValue([
            { ...mockSessions[1]!, user_agent: '<img src=x onerror=alert(1)>', provider: '"><script>x</script>' },
        ]);
        await mountSection();

        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('script')).toBeNull();
        expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
    });

    it('labels buttons for assistive technology', async () => {
        await mountSection();
        expect(rowButton(1).getAttribute('aria-label')).toBe('Terminate session on Safari on iOS');
        expect(rowButton(0).getAttribute('aria-label')).toContain('cannot be terminated');
        expect(container.querySelector('[role="status"]')).toBeTruthy();
    });

    it('removes its content on destroy', async () => {
        await mountSection();
        section!.destroy();
        expect(container.innerHTML).toBe('');
    });
});
