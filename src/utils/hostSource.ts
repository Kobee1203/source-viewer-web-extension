import { isHtmlExtension } from '@/utils/fileType';

/**
 * Extracts the raw source text directly from the host page's DOM.
 *
 * For HTML documents, reconstructs the doctype declaration and serializes `document.documentElement`.
 * For raw source files (CSS, JS, JSON, XML), browsers natively wrap the raw text in a `<pre>` element.
 */
export function extractHostSource(): string {
  const isHtml = isHtmlExtension(location.pathname) || document.contentType === 'text/html';
  if (isHtml) {
    const doctype = document.doctype
      ? `<!DOCTYPE ${document.doctype.name}` +
        (document.doctype.publicId ? ` PUBLIC "${document.doctype.publicId}"` : '') +
        (!document.doctype.publicId && document.doctype.systemId ? ' SYSTEM' : '') +
        (document.doctype.systemId ? ` "${document.doctype.systemId}"` : '') +
        `>\n`
      : '';
    return doctype + (document.documentElement ? document.documentElement.outerHTML : '');
  }

  const pre = document.querySelector('body > pre') ?? document.querySelector('pre');
  if (pre && pre.textContent !== null) {
    return pre.textContent;
  }
  return document.body?.innerText || document.documentElement?.textContent || '';
}
