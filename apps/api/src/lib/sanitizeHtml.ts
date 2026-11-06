import sanitize from 'sanitize-html';
import { env } from '../config/env';

/**
 * Rich text from the dashboard is cleaned when it is saved. Anything not in
 * this allow-list (scripts, event handlers, iframes, inline styles) is dropped.
 */
export function cleanHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote',
      'h2', 'h3', 'h4', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['https', 'http'] },
    // Relative image paths are allowed only for our own media.
    transformTags: {
      a: (tag, attribs) => ({
        tagName: tag,
        attribs: { ...attribs, ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}) },
      }),
    },
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !!frame.attribs.src && frame.attribs.src.startsWith('/') && !frame.attribs.src.startsWith(env.MEDIA_BASE_URL),
  });
}
