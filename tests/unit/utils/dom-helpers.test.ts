/**
 * Tests for DOM helpers
 */

import { vi } from 'vitest';
import {
    smoothScrollTo,
    scrollToTop,
    createElementFromHTML,
    addEventListenerWithCleanup,
    toggleClass,
    setAttributes,
    emptyElement,
    whenReady,
    debounce,
    escapeHtml,
} from '../../../src/utils/dom-helpers.js';

function mockReducedMotion(matches: boolean) {
    (window.matchMedia as any).mockImplementation((query: string) => ({
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    }));
}

describe('dom-helpers', () => {
    beforeEach(() => {
        mockReducedMotion(false);
        window.scrollTo = vi.fn() as any;
    });

    describe('escapeHtml', () => {
        it('escapes &, <, >, double and single quotes', () => {
            expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
        });

        it('leaves plain text unchanged', () => {
            expect(escapeHtml('my agent 1')).toBe('my agent 1');
        });

        it('does not double-decode existing entities', () => {
            expect(escapeHtml('&amp;')).toBe('&amp;amp;');
        });

        it.each(['"', "'"])('keeps attribute-breakout payloads inside a %s-quoted attribute', (quote) => {
            const payload = `x${quote} autofocus onfocus=${quote}alert(1)`;
            const host = document.createElement('div');
            host.innerHTML = `<button aria-label=${quote}${escapeHtml(payload)}${quote}>b</button>`;

            const button = host.querySelector('button')!;
            expect(button.getAttributeNames()).toEqual(['aria-label']);
            expect(button.getAttribute('aria-label')).toBe(payload);
        });
    });

    describe('smoothScrollTo', () => {
        it('scrolls smoothly by default', () => {
            const el = document.createElement('div');
            el.scrollIntoView = vi.fn();

            smoothScrollTo(el);

            expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
        });

        it('uses instant scrolling when reduced motion is preferred', () => {
            mockReducedMotion(true);
            const el = document.createElement('div');
            el.scrollIntoView = vi.fn();

            smoothScrollTo(el);

            expect(el.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
        });

        it('warns and does nothing when a selector matches nothing', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });

            expect(() => smoothScrollTo('#missing')).not.toThrow();
            expect(warn).toHaveBeenCalled();
            warn.mockRestore();
        });
    });

    describe('scrollToTop', () => {
        it('respects reduced motion', () => {
            mockReducedMotion(true);

            scrollToTop(true);

            expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
        });
    });

    it('createElementFromHTML returns the first element', () => {
        const el = createElementFromHTML('  <p class="x">hi</p>');

        expect(el.tagName).toBe('P');
        expect(el.textContent).toBe('hi');
    });

    it('addEventListenerWithCleanup returns a working remover', () => {
        const el = document.createElement('button');
        const handler = vi.fn();

        const remove = addEventListenerWithCleanup(el, 'click', handler);
        el.click();
        remove();
        el.click();

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('toggleClass honors the force argument', () => {
        const el = document.createElement('div');

        expect(toggleClass(el, 'a', true)).toBe(true);
        expect(toggleClass(el, 'a', true)).toBe(true);
        expect(toggleClass(el, 'a')).toBe(false);
    });

    it('setAttributes and emptyElement mutate the element', () => {
        const el = document.createElement('div');
        el.innerHTML = '<span></span><span></span>';

        setAttributes(el, { role: 'status', 'aria-live': 'polite' });
        emptyElement(el);

        expect(el.getAttribute('role')).toBe('status');
        expect(el.getAttribute('aria-live')).toBe('polite');
        expect(el.childNodes).toHaveLength(0);
    });

    it('whenReady runs the callback immediately once the document is loaded', () => {
        const cb = vi.fn();

        whenReady(cb);

        expect(cb).toHaveBeenCalled();
    });

    describe('debounce', () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        it('invokes once with the latest arguments', () => {
            const fn = vi.fn();
            const debounced = debounce(fn, 100);

            debounced(1);
            debounced(2);
            vi.advanceTimersByTime(100);

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith(2);
        });
    });
});
