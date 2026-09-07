# Source Code Viewer

A browser extension that intercepts navigation to raw source URLs and renders them as formatted, syntax-highlighted, interactive documents. Supports both source code files and font files.

## Language

### Viewers

**Source Viewer**:
The extension page that renders formatted, syntax-highlighted source code. User-initiated (explicit) or triggered by the In-Place Renderer.
_Avoid_: viewer, code viewer, source page

**Font Viewer**:
The extension page that renders font file previews with interactive controls (Font Preview, Glyph Grid, Writing System selector).
_Avoid_: font page, font preview page

**Extension Page**:
A fully independent page served by the extension. Each viewer is its own Extension Page with its own layout, entry point, and component tree.

**In-Place Renderer**:
Activates automatically when the browser navigates to a URL whose Content Type is recognised; replaces the raw browser output in the same tab while keeping the original URL in the address bar.
_Avoid_: auto-open, redirect, inline viewer

**Native Viewer**:
The browser's built-in `view-source:` viewer. Used as an explicit user toggle (toolbar button) and as the fallback when the extension cannot operate on a Restricted Domain.
_Avoid_: browser viewer, original viewer

**Restricted Domain**:
A domain where the extension cannot intercept navigation (e.g. the Chrome Web Store). Triggers a silent handoff to the Native Viewer.
_Avoid_: blocked domain, unsupported domain

### Source & Classification

**Source**:
The raw content of a URL (any scheme: http, https, file, blob). A Source cannot exist without a URL — the URL is always its anchor.
_Avoid_: code, content, document, page source

**Content Type**:
The MIME type of the HTTP response. The authoritative signal for triggering the In-Place Renderer and detecting FileType; URL extension is a fallback heuristic only.
_Avoid_: MIME type, media type

**FileType**:
The domain-level classification of a Source file: one of `html`, `css`, `javascript`, `json`, or `xml`. Detected from Content Type (MIME authoritative, URL extension fallback). The concept the rest of the system branches on — Search modes, Link Routing, Download behaviour, and In-Place Renderer activation all depend on FileType.
_Avoid_: language, format, file format, file extension

**Language**:
The CodeMirror syntax rendering layer for a given FileType. Mapped from FileType; responsible for syntax highlighting only.
_Avoid_: FileType, syntax, mode

### Search

**Search**:
The umbrella concept for finding content within a Source. Encompasses Text Search and Structural Search.

**Text Search**:
Plain-text matching within a Source. Supports live highlighting, case sensitivity, whole-word, and regular expressions.
_Avoid_: find, find in page, basic search

**Structural Search**:
Document-node matching using a query language. Semantically distinct from Text Search — it matches document structure, not text spans. Applies to HTML/XML (XPath, CSS Selector) and JSON (JSONPath).
_Avoid_: advanced search, query search, node search

**Search Mode**:
One of the available search strategies selectable by the user: Text Search, XPath, CSS Selector (for HTML/XML), or JSONPath (for JSON).
_Avoid_: search type, search option

### Display & Preferences

**Theme**:
The CodeMirror color and syntax-highlight theme applied to a Source. Purely visual; scoped to source rendering only. Distinct from Preferences.
_Avoid_: color scheme, skin, style

**Preferences**:
The user's settings for the extension, stored globally across all uses. Covers Word Wrap, Code Font Size, Theme selection, and Font Viewer display settings. Persisted in `browser.storage` (Font Viewer Preferences persistence is planned).
_Avoid_: settings, options, configuration, display settings

### Links & Download

**Source Link**:
A clickable URL within rendered Source, displayed as a decorated anchor. Opened according to Link Routing rules.
_Avoid_: link, hyperlink, URL

**Link Routing**:
The logic that classifies Source Links by type and opens them appropriately: images open in the browser natively, font files open in the Font Viewer, source files open in the Source Viewer or via the In-Place Renderer.
_Avoid_: link handling, URL routing, link dispatch

**Download**:
Saving the formatted Source to disk. Includes smart filename resolution (from `Content-Disposition` header, URL, or a default), `<base>` tag injection for HTML (so it renders locally), and relative URL rewriting for CSS (so assets resolve correctly).
_Avoid_: save, export

### Font Viewer

**Glyph**:
An individual character rendition in a font. Distinct from a Unicode code point — a font may have multiple Glyphs per code point, or none.
_Avoid_: character, symbol, letter

**Writing System**:
A named group of Unicode scripts the font covers (e.g. Latin, Cyrillic, CJK). Used to filter the Glyph Grid and initialise Sample Text. Only Writing Systems the font actually covers are listed.
_Avoid_: language, script, character set, charset

**Font Preview**:
The live rendering area in the Font Viewer that displays Sample Text with adjustable size, weight, style, and background.
_Avoid_: preview, render area, sample area

**Glyph Grid**:
The grid of all Glyphs the font covers, displayed in the Font Viewer. Supports exploration of the full character set and copy-to-clipboard of individual Glyphs.
_Avoid_: character table, glyph table, character map

**Sample Text**:
The adjustable text rendered in the Font Preview. Initialised from a Writing System default; editable by the user.
_Avoid_: preview text, test string
