import { StructuralSearchProvider, SearchMatch } from '@/composables/search/StructuralSearchProvider';
import { JSONPath } from 'jsonpath-plus';
import { parseTree, findNodeAtLocation } from 'jsonc-parser';

import { FileType } from '@/utils/fileType';
import type { I18nSimpleKey } from '@/utils/i18n';

export class JsonPathProvider implements StructuralSearchProvider {
  id = 'jsonpath';
  label = 'JSONPath';
  supportedFileTypes: FileType[] = ['json'];
  helpUrl = 'https://goessner.net/articles/JsonPath/';
  examples: { query: string; descriptionKey: I18nSimpleKey }[] = [
    { query: '$[*].name', descriptionKey: 'helpJsonPathEx1' },
    { query: '$[0:5]', descriptionKey: 'helpJsonPathEx2' },
    { query: '$..language', descriptionKey: 'helpJsonPathEx3' },
    { query: '$[*][?(@.language == "Sindhi")]', descriptionKey: 'helpJsonPathEx4' },
  ];

  search(text: string, query: string, _fileType: FileType): SearchMatch[] {
    if (!query.trim()) return [];

    let jsonObj: object;
    try {
      jsonObj = JSON.parse(text);
    } catch {
      // If the document is not valid JSON, we can't reliably search it
      // But we can try a relaxed parser if needed. For now, strict parse:
      throw new Error('Document is not valid JSON.');
    }

    const paths = JSONPath<string[]>({ path: query, json: jsonObj, resultType: 'path' });
    if (!paths || paths.length === 0) return [];

    const tree = parseTree(text);
    if (!tree) return [];

    const matches: SearchMatch[] = [];

    for (const pathStr of paths) {
      // pathStr is like "$['store']['book'][0]"
      const pathArray = JSONPath.toPathArray(pathStr).slice(1); // remove '$'
      // toPathArray returns strings, findNodeAtLocation works with string or number
      const mappedPath = pathArray.map((p) => {
        const num = parseInt(p, 10);
        return isNaN(num) ? p : num;
      });

      const node = findNodeAtLocation(tree, mappedPath);
      if (node) {
        let from = node.offset;
        let to = node.offset + node.length;

        // Visual optimization: if it's a large element (e.g. object/array)
        // we highlight just the key (if it has one) or just the opening bracket.
        if (node.parent && node.parent.type === 'property') {
          // Highlight the key instead
          const keyNode = node.parent.children?.[0];
          if (keyNode) {
            from = keyNode.offset;
            to = keyNode.offset + keyNode.length;
          }
        } else if (node.type === 'object' || node.type === 'array') {
          // No property key (e.g. root or array element), just highlight opening bracket
          to = from + 1;
        } else {
          // For primitives (string, number, boolean), we can highlight the whole value
          // Usually they fit on one line anyway.
        }

        matches.push({ from, to });
      }
    }

    return matches;
  }
}
