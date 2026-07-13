import { js as beautifyJs, css as beautifyCss, html as beautifyHtml } from 'js-beautify';
import type { FileType } from './fileType';

const OPTIONS = { indent_size: 2, preserve_newlines: true, max_preserve_newlines: 2 };

/** Pretty-prints source text according to its file type. */
export function formatSource(text: string, type: FileType): string {
  switch (type) {
    case 'javascript':
      return beautifyJs(text, OPTIONS);
    case 'css':
      return beautifyCss(text, OPTIONS);
    default:
      return beautifyHtml(text, OPTIONS);
  }
}
