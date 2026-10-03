import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';

const PORT = 4173;
const FIXTURES_DIR = join(import.meta.dirname, 'fixtures');

/** Content-Type mapping for static fixture files. */
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

/** Static fixture filenames that can be served from disk. */
const STATIC_FILES = new Set(['source.html', 'source.css', 'source.js', 'source.json', 'source.xml', 'font.ttf']);

const server = createServer((req, res) => {
  const path = req.url?.split('?')[0] ?? '/';

  // Virtual routes (no file on disk)
  if (path === '/error-404') {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Not Found', message: 'The requested resource does not exist' }));
    return;
  }

  if (path === '/csp-sandboxed.js') {
    res.writeHead(200, {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Content-Security-Policy': 'sandbox',
    });
    res.end('const sandboxed = true;\nconsole.log("This script is CSP sandboxed");\n');
    return;
  }

  if (path === '/page-for-capture.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      '<!doctype html><html><head><title>Capture Target</title></head>' +
        '<body><h1>Page to Capture</h1><p>This page will be captured by the extension.</p></body></html>',
    );
    return;
  }

  // Static fixture files
  const filename = path.slice(1); // strip leading /
  if (STATIC_FILES.has(filename)) {
    const ext = filename.slice(filename.lastIndexOf('.'));
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';
    try {
      const body = readFileSync(join(FIXTURES_DIR, filename));
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(body);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Failed to read fixture: ${filename}`);
    }
    return;
  }

  // Fallback: 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Unknown fixture route');
});

server.listen(PORT, () => {
  console.log(`E2E fixture server listening on http://localhost:${PORT}`);
});
