import { ViewPlugin, Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { viewerUrl } from '@/utils/viewerUrl';
import { fontViewerUrl } from '@/utils/fontViewerUrl';
import { classifyLinkTarget } from '@/utils/linkTarget';
import { extensionToFileType } from '@/utils/fileType';

/** Whether `value` is an absolute URL (`http(s)://…`) or protocol-relative (`//…`). */
function isAbsoluteUrl(value: string): boolean {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('//');
}

function resolveUrl(attr: string, rawUrl: string, baseUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
    return null;
  }
  if (attr === 'content' && !isAbsoluteUrl(rawUrl)) {
    return null;
  }
  try {
    const resolved = new URL(trimmed, baseUrl);
    // Route by target type: images render natively in the browser, fonts open in the dedicated font
    // viewer. For source files, link directly to the CSS/JS/JSON/XML types the in-place viewer
    // handles — the extension still shows the formatted viewer on navigation, while the address bar
    // keeps the real (copy-able) URL instead of an encoded viewer.html?url=… link. Other or
    // extensionless sources (e.g. HTML) still go through viewer.html to show their source.
    switch (classifyLinkTarget(resolved)) {
      case 'image':
        return resolved.toString();
      case 'font':
        return fontViewerUrl(resolved.toString());
      default:
        return extensionToFileType(resolved) ? resolved.toString() : viewerUrl(resolved.toString());
    }
  } catch {
    return null;
  }
}

function buildDecorations(view: EditorView, baseUrl: string): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);

    const regex = /(href|src|content)=["']([^"']+)["']|url\(['"]?([^)'"]+)['"]?\)/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
      const attr = match[1];
      const isUrlFunc = !!match[3];
      const rawUrl = isUrlFunc ? match[3] : match[2];

      const targetUrl = resolveUrl(attr, rawUrl, baseUrl);
      if (targetUrl) {
        // Find the exact offset of the URL within the match
        // Note: indexOf is safe here because we know rawUrl is exactly inside the match
        const urlStartInMatch = match[0].indexOf(rawUrl);
        const start = from + match.index + urlStartInMatch;
        const end = start + rawUrl.length;

        builder.add(
          start,
          end,
          Decoration.mark({
            tagName: 'a',
            class: 'source-link',
            attributes: {
              href: targetUrl,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          }),
        );
      }
    }
  }

  return builder.finish();
}

export function linkifyPlugin(baseUrl: string) {
  return ViewPlugin.define(
    (view: EditorView) => {
      return {
        decorations: buildDecorations(view, baseUrl),
        update(update: import('@codemirror/view').ViewUpdate) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = buildDecorations(update.view, baseUrl);
          }
        },
      };
    },
    {
      decorations: (v: { decorations: DecorationSet }) => v.decorations,
    },
  );
}
