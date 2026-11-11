import { mimeToFileType } from '@/utils/contentType';
import { isHtmlDocument } from '@/utils/fileType';
import { FAVICON_ATTR, HIDE_STYLE_ID, IFRAME_ID } from '@/utils/inplace';

const EXTENSION_INJECTED_SELECTOR = `#${HIDE_STYLE_ID}, #${IFRAME_ID}, [${FAVICON_ATTR}]`;
const WEBKIT_XML_VIEWER_ID = 'webkit-xml-viewer-source-xml';

function serializeDoctype(): string {
  if (!document.doctype) return '';
  return (
    `<!DOCTYPE ${document.doctype.name}` +
    (document.doctype.publicId ? ` PUBLIC "${document.doctype.publicId}"` : '') +
    (!document.doctype.publicId && document.doctype.systemId ? ' SYSTEM' : '') +
    (document.doctype.systemId ? ` "${document.doctype.systemId}"` : '') +
    `>\n`
  );
}

function serializeXmlDeclaration(): string {
  const xmlVersion: unknown = Reflect.get(document, 'xmlVersion');
  if (typeof xmlVersion !== 'string' || xmlVersion.length === 0) return '';
  const xmlEncoding: unknown = Reflect.get(document, 'xmlEncoding');
  const encodingAttr = typeof xmlEncoding === 'string' && xmlEncoding.length > 0 ? ` encoding="${xmlEncoding}"` : '';
  return `<?xml version="${xmlVersion}"${encodingAttr}?>\n`;
}

function cloneCleanRoot(): Element | null {
  if (!document.documentElement) return null;
  const cloned = document.documentElement.cloneNode(true);
  if (!(cloned instanceof Element)) return null;
  for (const el of cloned.querySelectorAll(EXTENSION_INJECTED_SELECTOR)) {
    el.remove();
  }
  return cloned;
}

/**
 * Extracts the raw source text directly from the host page's DOM.
 *
 * - For HTML documents, reconstructs the doctype declaration and serializes `document.documentElement`
 *   (stripping any elements injected by the extension).
 * - For XML documents, reconstructs the XML declaration / doctype and serializes the clean XML root
 *   element via `XMLSerializer` (or extracts from Chromium's `#webkit-xml-viewer-source-xml` holder).
 * - For raw plain-text source files (CSS, JS, JSON), reads the `<pre>` wrapper created by the browser.
 */
export function extractHostSource(): string {
  const isHtml = isHtmlDocument(location.pathname, document.contentType);
  if (isHtml) {
    const cleanRoot = cloneCleanRoot();
    return serializeDoctype() + (cleanRoot ? cleanRoot.outerHTML : '');
  }

  const isXml = mimeToFileType(document.contentType) === 'xml' || document.contentType === 'image/svg+xml';
  if (isXml) {
    const cleanRoot = cloneCleanRoot();
    const xmlViewerSource = cleanRoot?.querySelector(`#${WEBKIT_XML_VIEWER_ID}`);
    const targetRoot = xmlViewerSource?.firstElementChild ?? cleanRoot;
    if (!targetRoot) return '';
    return serializeXmlDeclaration() + serializeDoctype() + new XMLSerializer().serializeToString(targetRoot);
  }

  const pre = document.querySelector('body > pre') ?? document.querySelector('pre');
  if (pre && pre.textContent !== null) {
    return pre.textContent;
  }

  const cleanRoot = cloneCleanRoot();
  return document.body?.innerText || cleanRoot?.textContent || '';
}
