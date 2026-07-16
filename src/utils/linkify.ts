import { viewerUrl } from '@/utils/viewerUrl';

/**
 * Rewrites `href`/`src` attribute values inside a Prism-highlighted `<code>`
 * element into links that reopen the target in our viewer. Mutates in place.
 *
 * Relies on Prism's markup output shape: each `.token.attr-value` is preceded
 * (element-wise) by its `.token.attr-name`, and the raw value is the single
 * text node inside the attr-value span (quotes/`=` are their own punctuation
 * spans).
 */
export function linkifySourceUrls(codeEl: HTMLElement, baseUrl: string): void {
  if (!baseUrl) return;

  codeEl.querySelectorAll('.token.attr-value').forEach((attrValue) => {
    const nameEl = attrValue.previousElementSibling;
    const attr = nameEl?.classList.contains('attr-name') ? nameEl.textContent?.toLowerCase() : undefined;
    if (attr !== 'href' && attr !== 'src') return;

    attrValue.childNodes.forEach((child) => {
      if (child.nodeType !== Node.TEXT_NODE) return;
      const rawUrl = (child.textContent ?? '').trim();
      // Skip hash fragments, javascript/data URIs, and empty strings.
      if (!rawUrl || rawUrl.startsWith('#') || rawUrl.startsWith('javascript:') || rawUrl.startsWith('data:')) {
        return;
      }
      try {
        const resolvedUrl = new URL(rawUrl, baseUrl).toString();
        const link = document.createElement('a');
        link.className = 'source-link';
        link.textContent = child.textContent ?? ''; // preserve original spacing
        link.href = viewerUrl(resolvedUrl);
        link.target = '_blank';
        child.replaceWith(link);
      } catch (e) {
        console.warn('Failed to resolve URL:', rawUrl, e);
      }
    });
  });
}
