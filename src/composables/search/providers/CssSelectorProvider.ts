import { StructuralSearchProvider, SearchMatch } from '@/composables/search/StructuralSearchProvider';
import * as htmlparser2 from 'htmlparser2';
import { selectAll } from 'css-select';

import { FileType } from '@/utils/fileType';

export class CssSelectorProvider implements StructuralSearchProvider {
  id = 'css-selector';
  label = 'CSS Selector';
  supportedFileTypes: FileType[] = ['html', 'xml'];

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
