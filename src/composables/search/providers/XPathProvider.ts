import { StructuralSearchProvider, SearchMatch } from '@/composables/search/StructuralSearchProvider';
import { DOMParser, type Document, type Node } from '@xmldom/xmldom';
import { FileType } from '@/utils/fileType';
import * as xpath from 'xpath';
import type { I18nSimpleKey } from '@/utils/i18n';

interface XmlNode {
  lineNumber: number;
  columnNumber: number;
  nodeType?: number;
  nodeName?: string;
}

function isXmlNode(node: unknown): node is XmlNode {
  return typeof node === 'object' && node !== null && 'lineNumber' in node && 'columnNumber' in node;
}

export class XPathProvider implements StructuralSearchProvider {
  id = 'xpath';
  label = 'XPath';
  supportedFileTypes: FileType[] = ['html', 'xml'];
  helpUrl = 'https://developer.mozilla.org/en-US/docs/Web/XPath';
  examples: { query: string; descriptionKey: I18nSimpleKey }[] = [
    { query: '//div', descriptionKey: 'helpXPathEx1' },
    { query: '//div[@class="test"]', descriptionKey: 'helpXPathEx2' },
    { query: '//a[contains(@href, "example")]', descriptionKey: 'helpXPathEx3' },
    { query: '//*[@id="main"]//p', descriptionKey: 'helpXPathEx4' },
  ];

  search(text: string, query: string, fileType: FileType): SearchMatch[] {
    if (!query.trim()) return [];

    let doc: Document;
    try {
      const mimeType = fileType === 'xml' ? 'text/xml' : 'text/html';
      doc = new DOMParser({
        locator: true,
        errorHandler: () => {}, // ignore errors
      }).parseFromString(text, mimeType);

      const stripNamespaces = (node: Node) => {
        if (node.namespaceURI) {
          Object.assign(node, { namespaceURI: null });
        }
        let child = node.firstChild;
        while (child) {
          stripNamespaces(child);
          child = child.nextSibling;
        }
      };

      stripNamespaces(doc);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Document is not valid XML/HTML: ${message}`);
    }

    let nodes;
    try {
      // @ts-expect-error xpath expects standard DOM Node, but xmldom Document is compatible at runtime
      nodes = xpath.select(query, doc);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(message || 'Invalid XPath Query.');
    }

    // Convert node array and map to offsets
    const results: SearchMatch[] = [];

    // We only care about nodes that have line/column information (e.g. Elements, Attributes)
    const validNodes: XmlNode[] = [];
    const nodesArray = Array.isArray(nodes) ? nodes : [nodes];
    for (const n of nodesArray) {
      if (isXmlNode(n)) {
        validNodes.push(n);
      }
    }

    if (validNodes.length > 0) {
      // Pre-calculate line start offsets to optimize getOffset
      const lineStarts: number[] = [0];
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') {
          lineStarts.push(i + 1);
        }
      }

      for (const node of validNodes) {
        const lineIndex = node.lineNumber - 1;
        if (lineIndex >= 0 && lineIndex < lineStarts.length) {
          const colIndex = node.columnNumber - 1;
          const startIndex = lineStarts[lineIndex] + colIndex;

          // For elements, startIndex points to '<'. We highlight the tag name.
          if (node.nodeType === 1) {
            // ELEMENT_NODE
            const from = startIndex + 1;
            const to = from + (node.nodeName ? node.nodeName.length : 0);
            results.push({ from, to });
          } else {
            // For other node types (attributes, text), highlight starting at the index
            const from = startIndex;
            const to = from + (node.nodeName ? node.nodeName.length : 1);
            results.push({ from, to });
          }
        }
      }
    }

    return results;
  }
}
