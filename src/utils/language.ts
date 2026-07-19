import type { Extension } from '@codemirror/state';
import { DEFAULT_FILE_TYPE, type FileType } from '@/utils/fileType';

/**
 * Loads the CodeMirror language support for a file type on demand. Each `@codemirror/lang-*`
 * is imported dynamically so it builds to its own lazy chunk — loaded only when a file of that
 * type is viewed — instead of being inlined into the viewer bundle. `lang-html` also pulls in
 * CSS and JavaScript, since HTML embeds them.
 */
export function loadLanguage(language: FileType): Promise<Extension> {
  switch (language) {
    case 'javascript':
      return import('@codemirror/lang-javascript').then((m) => m.javascript());
    case 'css':
      return import('@codemirror/lang-css').then((m) => m.css());
    case 'json':
      return import('@codemirror/lang-json').then((m) => m.json());
    case 'xml':
      return import('@codemirror/lang-xml').then((m) => m.xml());
    case DEFAULT_FILE_TYPE:
    default:
      return import('@codemirror/lang-html').then((m) => m.html());
  }
}
