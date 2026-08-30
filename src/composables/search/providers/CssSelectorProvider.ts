import { selectAll } from 'css-select';
import * as htmlparser2 from 'htmlparser2';
import type { SearchMatch, StructuralSearchProvider } from '@/composables/search/StructuralSearchProvider';
import type { FileType } from '@/utils/fileType';
import type { I18nSimpleKey } from '@/utils/i18n';

export class CssSelectorProvider implements StructuralSearchProvider {
  id = 'css-selector';
  label = 'CSS Selector';
  supportedFileTypes: FileType[] = ['html', 'xml'];
  helpUrl = 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors';
  examples: { query: string; descriptionKey: I18nSimpleKey }[] = [
    { query: 'div', descriptionKey: 'helpCssEx1' },
    { query: 'div.test', descriptionKey: 'helpCssEx2' },
    { query: 'a[href*="example"]', descriptionKey: 'helpCssEx3' },
    { query: '#main p', descriptionKey: 'helpCssEx4' },
  ];

  search(text: string, query: string, fileType: FileType): SearchMatch[] {
    if (!query.trim()) return [];

    let dom;
    try {
      const isXml = fileType === 'xml';
      dom = htmlparser2.parseDocument(text, { withStartIndices: true, withEndIndices: true, xmlMode: isXml });
    } catch {
      throw new Error('Failed to parse HTML/XML.');
    }

    let matches: unknown[];
    try {
      matches = selectAll(query, dom);
    } catch (err: unknown) {
      // CSSselect throws on invalid queries
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(message || 'Invalid CSS Selector.');
    }

    const results: SearchMatch[] = [];

    for (const rawMatch of matches) {
      const match = rawMatch as { startIndex?: number; name?: string };
      if (match.startIndex !== null && match.startIndex !== undefined) {
        // match.startIndex is the start of the opening tag '<'.
        // For visual clarity, we highlight just the tag name, e.g. 'div'
        // which starts at startIndex + 1 (skipping '<') and has length match.name.length.
        const from = match.startIndex + 1;
        const to = from + (match.name ? match.name.length : 0);
        results.push({ from, to });
      }
    }

    return results;
  }
}
