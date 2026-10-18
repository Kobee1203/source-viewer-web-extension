/** Matches HTML href/src/content attributes or CSS url(...) values. */
export const REFERENCE_URL_REGEX = /(href|src|content)=["']([^"']+)["']|url\(['"']?([^)'"]+)['"']?\)/g;

export interface ExtractedReferenceMatch {
  matchText: string;
  attr: string | undefined;
  rawUrl: string;
  index: number;
}

/** Whether `value` is an absolute URL (`http(s)://…`) or protocol-relative (`//…`). */
export function isAbsoluteUrl(value: string): boolean {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('//');
}

/**
 * Iterates through all reference occurrences (HTML attributes or CSS url() functions)
 * found within the given text.
 */
export function* extractReferenceMatches(text: string): Generator<ExtractedReferenceMatch> {
  const regex = new RegExp(REFERENCE_URL_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchText = match[0];
    const attr = match[1];
    const isUrlFunc = !!match[3];
    const rawUrl = isUrlFunc ? match[3] : match[2];

    if (matchText && rawUrl) {
      yield {
        matchText,
        attr,
        rawUrl,
        index: match.index,
      };
    }
  }
}

/**
 * Validates and resolves a candidate reference URL against a base URL.
 * Rejects empty strings, hash anchors, non-navigable execution schemes (javascript:, data:, vbscript:),
 * and relative content= attributes.
 */
export function parseReferenceUrl(attr: string | undefined, rawUrl: string, baseUrl: string): URL | null {
  const trimmed = rawUrl.trim();
  const lower = trimmed.toLowerCase();

  if (
    !trimmed ||
    trimmed.startsWith('#') ||
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return null;
  }

  // content= attributes only carry URLs when absolute (meta http-equiv, og:image, etc.)
  if (attr === 'content' && !isAbsoluteUrl(trimmed)) {
    return null;
  }

  try {
    return new URL(trimmed, baseUrl);
  } catch {
    return null;
  }
}
