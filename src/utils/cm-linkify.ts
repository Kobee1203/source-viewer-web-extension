import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, type DecorationSet, type EditorView, ViewPlugin } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import { extensionToFileType } from '@/utils/fileType';
import { classifyLinkTarget } from '@/utils/linkTarget';
import { extractReferenceMatches, parseReferenceUrl } from '@/utils/referenceUrl';
import { viewerUrl } from '@/utils/viewerUrl';

export function resolveUrl(attr: string | undefined, rawUrl: string, baseUrl: string): string | null {
  const resolved = parseReferenceUrl(attr, rawUrl, baseUrl);
  if (!resolved) {
    return null;
  }
  // Route by target type: images render natively in the browser, fonts and source files
  // go through the viewer.
  switch (classifyLinkTarget(resolved)) {
    case 'image':
      return resolved.toString();
    case 'font':
      return viewerUrl(resolved.toString());
    default:
      return extensionToFileType(resolved) ? resolved.toString() : viewerUrl(resolved.toString());
  }
}

function buildDecorations(view: EditorView, baseUrl: string): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);

    for (const { matchText, attr, rawUrl, index } of extractReferenceMatches(text)) {
      const targetUrl = resolveUrl(attr, rawUrl, baseUrl);
      if (targetUrl) {
        // Find the exact offset of the URL within the match
        // Note: indexOf is safe here because we know rawUrl is exactly inside the match
        const urlStartInMatch = matchText.indexOf(rawUrl);
        const start = from + index + urlStartInMatch;
        const end = start + rawUrl.length;

        builder.add(
          start,
          end,
          Decoration.mark({
            tagName: 'a',
            class: 'source-link',
            attributes: {
              href: targetUrl,
              'data-raw-url': rawUrl,
              'data-target-url': targetUrl,
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
        update(update: ViewUpdate) {
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
