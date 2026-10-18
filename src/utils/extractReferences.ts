import { type FileType, extensionToFileType } from '@/utils/fileType';
import { classifyLinkTarget } from '@/utils/linkTarget';
import { extractReferenceMatches, parseReferenceUrl } from '@/utils/referenceUrl';

export interface ReferenceEntry {
  /** Resolved absolute URL of the referenced file. */
  url: string;
  /** Basename of the file, for display in the sidebar. */
  filename: string;
  /** Routing category: images are excluded; only 'source' and 'font' entries are returned. */
  linkTarget: 'source' | 'font';
  /** FileType detected from the URL extension, or null for font files. */
  fileType: FileType | null;
  /** Number of times this URL appears in the source. */
  count: number;
}

/** Returns the basename of a URL's pathname, falling back to the raw URL string. */
function basename(url: URL): string {
  const parts = url.pathname.split('/').filter(Boolean);
  return parts.pop() ?? url.toString();
}

/**
 * Scans the **entire** source text for referenced files and returns a deduplicated list,
 * excluding images. Uses the same attribute/URL patterns as the CodeMirror linkify plugin
 * but operates on the full document rather than the visible viewport only.
 */
export function extractReferences(source: string, baseUrl: string): ReferenceEntry[] {
  if (!source || !baseUrl) return [];

  const counts = new Map<string, number>();
  const entries = new Map<string, ReferenceEntry>();

  for (const { attr, rawUrl } of extractReferenceMatches(source)) {
    const resolved = parseReferenceUrl(attr, rawUrl, baseUrl);
    if (!resolved) continue;

    const linkTarget = classifyLinkTarget(resolved);
    if (linkTarget === 'image') continue; // images are excluded from the sidebar

    const urlStr = resolved.toString();
    counts.set(urlStr, (counts.get(urlStr) ?? 0) + 1);

    if (!entries.has(urlStr)) {
      entries.set(urlStr, {
        url: urlStr,
        filename: basename(resolved),
        linkTarget,
        fileType: linkTarget === 'source' ? (extensionToFileType(resolved) ?? null) : null,
        count: 1,
      });
    }
  }

  return Array.from(entries.values()).map((e) => ({ ...e, count: counts.get(e.url) ?? 1 }));
}
