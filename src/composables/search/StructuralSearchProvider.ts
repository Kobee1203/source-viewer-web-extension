import type { FileType } from '@/utils/fileType';
import type { I18nSimpleKey } from '@/utils/i18n';

export interface SearchMatch {
  from: number;
  to: number;
}

export interface StructuralSearchProvider {
  /** Uniquely identifies this search mode (e.g., 'css-selector', 'jsonpath', 'xpath') */
  id: string;
  /** Label for the UI */
  label: string;
  /** Optional list of supported file types for this provider */
  supportedFileTypes?: FileType[];
  helpUrl: string;
  examples: { query: string; descriptionKey: I18nSimpleKey }[];
  /**
   * Returns matches based on the query and source text.
   * If parsing or query execution fails, it should throw an error or return an empty array,
   * depending on if we want to show syntax errors to the user.
   */
  search(text: string, query: string, fileType: FileType): SearchMatch[];
}
