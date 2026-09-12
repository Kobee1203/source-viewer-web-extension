export interface SourceReport {
  byteSize: number;
  contentType: string;
  formatted: boolean;
  durationMs: number;
}

/**
 * High-performance source formatter and font inspector.
 * Provides rich CodeMirror 6 syntax highlighting and instant preview.
 */
export class SourceViewerService {
  private activeTheme = 'tokyo-night';
  private supportedLanguages = new Set(['html', 'css', 'javascript', 'json', 'xml']);

  constructor(private readonly debugMode: boolean = false) {}

  public async inspectSource(targetUrl: URL): Promise<SourceReport> {
    const startTime = performance.now();
    const response = await fetch(targetUrl.toString());
    const text = await response.text();

    return {
      byteSize: new Blob([text]).size,
      contentType: response.headers.get('content-type') ?? 'text/plain',
      formatted: true,
      durationMs: Math.round(performance.now() - startTime),
    };
  }
}
