import { describe, expect, it } from 'vitest';
import { cleanHtml } from './sanitizeHtml';

describe('cleanHtml', () => {
  it('removes scripts, handlers and styles but keeps formatting', () => {
    const out = cleanHtml('<p onclick="x()" style="color:red">Hello <strong>world</strong></p><script>alert(1)</script>');
    expect(out).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('blocks javascript: links and adds rel to new-tab links', () => {
    expect(cleanHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript');
    expect(cleanHtml('<a href="https://example.com" target="_blank">x</a>')).toContain('noopener');
  });

  it('only allows relative images from the media path', () => {
    expect(cleanHtml('<img src="/media/images/a.webp" alt="ok">')).toContain('/media/images/a.webp');
    expect(cleanHtml('<img src="/etc/passwd" alt="no">')).toBe('');
  });
});
