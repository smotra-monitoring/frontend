import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../../src/utils/html.js';

describe('escapeHtml', () => {
  it('escapes characters that can break HTML text or quoted attributes', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('escapes existing entity-like text without interpreting it', () => {
    expect(escapeHtml('&quot; onfocus=&quot;alert(1)')).toBe(
      '&amp;quot; onfocus=&amp;quot;alert(1)',
    );
  });
});
