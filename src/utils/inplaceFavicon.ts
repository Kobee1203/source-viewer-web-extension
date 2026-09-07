import icon16 from '@/public/icon/16.png?inline';
import icon48 from '@/public/icon/48.png?inline';

const ICONS = [
  { href: icon16, sizes: '16x16' },
  { href: icon48, sizes: '48x48' },
] as const;

const FAVICON_ATTR = 'data-source-viewer-favicon';

interface SavedFavicon {
  el: HTMLLinkElement;
  parent: Node;
  nextSibling: Node | null;
}

function createFaviconLink(href: string, sizes: string): HTMLLinkElement {
  const link = document.createElementNS('http://www.w3.org/1999/xhtml', 'link') as HTMLLinkElement;
  link.rel = 'icon';
  link.type = 'image/png';
  link.setAttribute('sizes', sizes);
  link.setAttribute(FAVICON_ATTR, 'true');
  link.href = href;
  return link;
}

/**
 * Updates the host document's favicon to the extension's icon during in-place viewing.
 *
 * An in-place viewer mounts `viewer.html` inside a full-viewport iframe on the host page.
 * The browser tab favicon is determined by the top-level document, not the iframe, and
 * browsers forbid `chrome-extension://` favicons on web pages for security.
 *
 * Vite inlines the PNG icons as base64 data URIs at build time via `?inline`, keeping
 * `src/public/icon/` as the single source of truth.
 *
 * Returns a cleanup function that restores the original favicons if the viewer fails or unmounts.
 */
export function setInplaceFavicon(): () => void {
  const existingFavicons = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']"));
  const savedFavicons: SavedFavicon[] = [];

  for (const el of existingFavicons) {
    if (el.hasAttribute(FAVICON_ATTR)) continue;
    const parent = el.parentNode;
    if (!parent) continue;
    savedFavicons.push({ el, parent, nextSibling: el.nextSibling });
    el.remove();
  }

  const target = document.head || document.documentElement;
  const links = ICONS.map(({ href, sizes }) => {
    const link = createFaviconLink(href, sizes);
    target.appendChild(link);
    return link;
  });

  return () => {
    for (const link of links) {
      link.remove();
    }
    for (const { el, parent, nextSibling } of savedFavicons) {
      parent.insertBefore(el, nextSibling);
    }
  };
}
