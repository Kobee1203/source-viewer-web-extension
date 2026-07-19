import { js as beautifyJs, css as beautifyCss, html as beautifyHtml, CoreBeautifyOptions } from 'js-beautify';
import type { FileType } from './fileType';

const OPTIONS = {
  indent_size: 2,
  preserve_newlines: true,
  max_preserve_newlines: 2,
} satisfies CoreBeautifyOptions;

/** Pretty-prints source text according to its file type. */
export function formatSource(text: string, type: FileType): string {
  switch (type) {
    case 'javascript':
      return beautifyJs(text, OPTIONS);
    case 'css':
      return beautifyCss(text, OPTIONS);
    case 'json':
      return formatJson(text, OPTIONS);
    default:
      return beautifyHtml(text, OPTIONS);
  }
}

/** Pretty-prints JSON; falls back to the raw text when it isn't valid JSON (e.g. JSONC). */
function formatJson(text: string, options: CoreBeautifyOptions): string {
  try {
    return JSON.stringify(JSON.parse(text), null, options.indent_size);
  } catch {
    console.warn('Invalid JSON!');
    return beautifyJs(text, options);
  }
}
