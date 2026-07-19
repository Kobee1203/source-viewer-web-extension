import { ViewPlugin, Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { viewerUrl } from '@/utils/viewerUrl';
import { classifyLinkTarget } from '@/utils/linkTarget';

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
    return classifyLinkTarget(resolved) === 'image' ? resolved.toString() : viewerUrl(resolved.toString());
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
