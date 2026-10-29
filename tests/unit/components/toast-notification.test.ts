/**
 * Tests for ToastNotification
 */

import { vi } from 'vitest';
import { ToastNotification } from '../../../src/components/toast-notification.js';

describe('ToastNotification', () => {
    let root: HTMLElement;
    let toast: ToastNotification;

    const toasts = () => root.querySelectorAll('.toast');

    beforeEach(() => {
        vi.useFakeTimers();
        root = document.createElement('div');
        document.body.appendChild(root);
        toast = new ToastNotification(root);
        toast.mount();
    });

    afterEach(() => {
        toast.destroy();
        root.remove();
        vi.useRealTimers();
    });

    it('renders an empty live region initially', () => {
        expect(root.querySelector('[aria-live="polite"]')).not.toBeNull();
        expect(toasts()).toHaveLength(0);
    });

    it('shows a toast with the matching type class', () => {
        toast.success('Saved');

        expect(toasts()).toHaveLength(1);
        expect(root.querySelector('.toast--success')).not.toBeNull();
        expect(root.querySelector('.toast__message')!.textContent).toBe('Saved');
    });

    it('escapes HTML in messages (security check)', () => {
        toast.info('<img src=x onerror=alert(1)>');

        expect(root.querySelector('img')).toBeNull();
    });

    it('auto-dismisses after the duration', () => {
        toast.success('Saved', 1000);

        vi.advanceTimersByTime(1000); // starts exit animation
        vi.advanceTimersByTime(300);

        expect(toasts()).toHaveLength(0);
    });

    it('does not auto-dismiss errors by default', () => {
        toast.error('Failed');

        vi.advanceTimersByTime(60_000);

        expect(toasts()).toHaveLength(1);
    });

    it('dismisses a toast via its dismiss button', () => {
        toast.error('Failed');

        root.querySelector<HTMLButtonElement>('[data-action="dismiss"]')!.click();
        vi.advanceTimersByTime(300);

        expect(toasts()).toHaveLength(0);
    });

    it('dismissAll clears every toast and pending timer', () => {
        toast.success('a');
        toast.warning('b');

        toast.dismissAll();

        expect(toasts()).toHaveLength(0);
    });

    it('shows a toast when a system:notification event is dispatched', () => {
        window.dispatchEvent(new CustomEvent('system:notification', {
            detail: { severity: 'warning', message: 'Agent down' },
        }));

        expect(root.querySelector('.toast--warning')).not.toBeNull();
        expect(root.querySelector('.toast__message')!.textContent).toBe('Agent down');
    });

    it('stops listening for notifications after destroy', () => {
        toast.destroy();

        window.dispatchEvent(new CustomEvent('system:notification', {
            detail: { severity: 'info', message: 'late' },
        }));

        expect(toasts()).toHaveLength(0);
    });
});
