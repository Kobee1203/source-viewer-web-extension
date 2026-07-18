import { viewerUrl } from '@/utils/viewerUrl';
import { classifyLinkTarget } from '@/utils/linkTarget';

/**
 * Turns URLs inside a Prism-highlighted `<code>` element into clickable links,
 * routed by the target's type. Mutates in place. Handles two shapes:
 *
 * - HTML `href`/`src`/`content` attribute values (`.token.attr-value` preceded by
 *   its `.token.attr-name`; the raw value is the text node inside the attr-value span,
 *   quotes being their own punctuation spans).
 * - CSS `url(…)` values (`.token.url`), quoted or not.
 *
 * Images open in the browser (rendered natively — `image/*` is excluded from the
 * direct-navigation auto-open, so no hijack); everything else — source files and,
 * for now, fonts — reopens in our code viewer. Fonts will point to a dedicated font
 * viewer once it exists; until then they're treated like any other source.
 */
export function linkifySourceUrls(codeEl: HTMLElement, baseUrl: string): void {
  if (!baseUrl) return;
  linkifyHtmlAttributes(codeEl, baseUrl);
  linkifyCssUrls(codeEl, baseUrl);
}

function linkifyHtmlAttributes(codeEl: HTMLElement, baseUrl: string): void {
  codeEl.querySelectorAll('.token.attr-value').forEach((attrValue) => {
    const nameEl = attrValue.previousElementSibling;
    const attr = nameEl?.classList.contains('attr-name') ? nameEl.textContent?.toLowerCase() : undefined;
    if (attr !== 'href' && attr !== 'src' && attr !== 'content') return;

    attrValue.childNodes.forEach((child) => {
      if (child.nodeType !== Node.TEXT_NODE) return;
      const raw = child.textContent ?? '';
      // `content` (e.g. og:image) holds arbitrary text — "true", "width=device-width",
      // "0; url=…" — so only linkify it when the value is clearly an absolute URL, to
      // avoid resolving non-URLs into bogus links. href/src may be relative.
      if (attr === 'content' && !isAbsoluteUrl(raw)) return;
      linkifyTextNode(child, raw, baseUrl);
    });
  });
}

/** Whether `value` is an absolute URL (`http(s)://…`) or protocol-relative (`//…`). */
function isAbsoluteUrl(value: string): boolean {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('//');
}

function linkifyCssUrls(codeEl: HTMLElement, baseUrl: string): void {
  // `:not(.string)` selects only the outer `url(…)` wrapper: the inner quoted value
  // is a `.token.string` aliased `url` (class `token string url`), which also matches
  // `.token.url` and would otherwise be processed twice.
  codeEl.querySelectorAll('.token.url:not(.string)').forEach((urlToken) => {
    // Quoted: url("…") → a nested `.token.string` whose text node includes the quotes.
    const stringEl = urlToken.querySelector('.token.string');
    if (stringEl) {
      const textNode = stringEl.firstChild;
      if (textNode?.nodeType === Node.TEXT_NODE) {
        linkifyTextNode(textNode, stripQuotes(textNode.textContent ?? ''), baseUrl);
      }
      return;
    }

    // Unquoted: url(foo.woff2) → the raw URL is a bare text node between the punctuation.
    urlToken.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim()) {
        linkifyTextNode(child, child.textContent ?? '', baseUrl);
      }
    });
  });
}

/**
 * Replaces `textNode` with an `<a>` pointing at `rawUrl` (resolved against `baseUrl`),
 * keeping the node's original text — and thus its spacing/quotes — as the link label.
 */
function linkifyTextNode(textNode: ChildNode, rawUrl: string, baseUrl: string): void {
  const trimmed = rawUrl.trim();
  // Skip hash fragments, javascript/data URIs, and empty strings.
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
    return;
  }
  try {
    const resolved = new URL(trimmed, baseUrl);
    const link = document.createElement('a');
    link.className = 'source-link';
    link.textContent = textNode.textContent ?? '';
    link.href = destinationHref(resolved);
    link.target = '_blank';
    textNode.replaceWith(link);
  } catch (e) {
    console.warn('Failed to resolve URL:', trimmed, e);
  }
}

/** Images render natively in the browser; source (and, for now, fonts) reopen in the viewer. */
function destinationHref(resolved: URL): string {
  return classifyLinkTarget(resolved) === 'image' ? resolved.toString() : viewerUrl(resolved.toString());
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  const first = trimmed[0];
  if (trimmed.length >= 2 && (first === '"' || first === "'") && trimmed[trimmed.length - 1] === first) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
