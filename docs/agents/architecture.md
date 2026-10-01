# Architecture & Cross-Context Messaging

This document defines the system architecture, execution contexts, communication channels, and messaging contracts of the Source Code Viewer Web Extension (Manifest V3).

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Execution Contexts Matrix](#execution-contexts-matrix)
3. [Communication Transports](#communication-transports)
4. [Key Workflows & Sequence Diagrams](#key-workflows--sequence-diagrams)
   - [Workflow 1: In-Place Interception & Remote Fetching (HTTP/HTTPS)](#workflow-1-in-place-interception--remote-fetching-httphttps)
   - [Workflow 2: In-Place DOM Extraction & Content-Type Propagation](#workflow-2-in-place-dom-extraction--content-type-propagation)
   - [Workflow 3: CSP Sandbox Fallback (Tab Redirection)](#workflow-3-csp-sandbox-fallback-tab-redirection)
   - [Workflow 4: Explicit Actions, Tab Source Capture, & View-Source Interception](#workflow-4-explicit-actions-tab-source-capture--view-source-interception)
   - [Workflow 5: Local File Picking, Dropping, & Snapshot Persistence](#workflow-5-local-file-picking-dropping--snapshot-persistence)
   - [Workflow 6: Local Directory Projects & Virtual File System (VFS) Exploration](#workflow-6-local-directory-projects--virtual-file-system-vfs-exploration)
   - [Workflow 7: Multi-View Switching (Code vs Fonts)](#workflow-7-multi-view-switching-code-vs-fonts)
5. [Message Contracts Reference](#message-contracts-reference)
6. [Architectural Considerations & Constraints](#architectural-considerations--constraints)

---

## System Architecture Overview

The extension operates across multiple isolated execution contexts governed by WebExtension Manifest V3 security boundaries:

```mermaid
flowchart TB
    subgraph BrowserHostTab["Browser Tab (Host Page)"]
        HostDOM["Host Document DOM\n(Raw source/XML/JSON/HTML)"]
        CS_Light["content.ts\n(Always-on lightweight detector)"]
        CS_Inplace["inplace-viewer.content.ts\n(Dynamically injected runner)"]

        subgraph InPlaceIframe["In-Place Iframe (chrome-extension://.../viewer.html)"]
            IframeApp["Viewer Vue App\n(useSourceFetch, CodeMirror, etc.)"]
        end

        CS_Light -.->|sniffs content-type| HostDOM
        CS_Inplace -->|extracts text| HostDOM
        CS_Inplace -->|embeds| InPlaceIframe
        IframeApp <-->|window.postMessage| CS_Inplace
    end

    subgraph BackgroundContext["Background Service Worker"]
        SW["background.ts\n- NativeViewerController\n- Context Menus\n- Tab & view-source router\n- fetchSource() proxy"]
    end

    subgraph StandaloneTabs["Standalone Extension Tabs"]
        ViewerTab["viewer.html\n(Unified multi-view tab: Code & Fonts)"]
        OptionsTab["options.html\n(Settings page)"]
    end

    subgraph BrowserAPIs["Browser Extension APIs & Storage"]
        BrowserStorage["browser.storage.local (Preferences: openIn, theme, wrap, etc.)\nbrowser.storage.session (Captured tab source cache)"]
        BrowserScripting["browser.scripting.executeScript\n(inplace-viewer.js, tab-capture.js)"]
        BrowserTabs["browser.tabs / browser.contextMenus"]
        ClientStorage["IndexedDB (directory-store)\nsessionStorage (file drop snapshot)"]
    end

    CS_Light -->|browser.runtime.sendMessage\nREQUEST_VIEWER_INJECTION| SW
    CS_Light -->|browser.runtime.sendMessage\nREQUEST_VIEWER_REDIRECT| SW
    SW -->|injects via executeScript| CS_Inplace

    IframeApp -->|browser.runtime.sendMessage\nFETCH_SOURCE| SW
    ViewerTab -->|browser.runtime.sendMessage\nFETCH_SOURCE / OPEN_NATIVE\nGET_SESSION_SOURCE| SW

    ViewerTab -->|read/write| BrowserStorage
    ViewerTab -->|read/write| ClientStorage
    SW -->|read/write| BrowserStorage
    SW --> BrowserTabs
    SW --> BrowserScripting
```

---

## Execution Contexts Matrix

| Context                        | Entry Point                                    | Lifecycle                                                                       | Privileges & Capabilities                                                                                                                               | Constraints                                                                                                 |
| :----------------------------- | :--------------------------------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------- |
| **Background Service Worker**  | `src/entrypoints/background.ts`                | Event-driven (terminated when idle by browser in MV3)                           | Full WebExtension APIs (`browser.tabs`, `browser.scripting`, `browser.contextMenus`, `browser.storage`). Cross-origin HTTP/HTTPS fetching with cookies. | **No DOM access**. **Cannot fetch `file://` URLs** (prohibited by browser security in MV3 service workers). |
| **Lightweight Content Script** | `src/entrypoints/content.ts`                   | Runs on top-frame navigation at `document_start` (`matches: http, https, file`) | Reads `document.contentType` and URL, injects root hiding style (`:root { visibility: hidden !important; }`). Can send runtime messages to background.  | Kept minimal (no Vue, no CodeMirror) to avoid per-page overhead. Isolated world DOM access.                 |
| **In-Place Content Script**    | `src/entrypoints/inplace-viewer.content.ts`    | Injected dynamically on demand via `browser.scripting.executeScript`            | Mounts full-viewport iframe pointing to `viewer.html?url=...`, updates tab favicon, reads host DOM. Communicates with iframe via `window.postMessage`.  | Runs only when a supported source type is confirmed and page is not CSP sandboxed.                          |
| **In-Place Iframe**            | `src/entrypoints/viewer/index.html` (embedded) | Embedded in host tab inside an `<iframe>`                                       | Extension origin (`chrome-extension://...`). Full Vue 3, CodeMirror, and UI features. Can access `browser.runtime.sendMessage`.                         | Sandboxed from parent window (cannot touch parent DOM directly; must use `window.postMessage`).             |
| **Unified Multi-View Viewer**  | `src/entrypoints/viewer/index.html` (top tab)  | Dedicated browser tab (`chrome-extension://...`)                                | Direct window fetch of `file:///` and font URLs. Full access to Web File System Access API, Drag & Drop, CodeMirror, and FontFace API.                  | No parent page DOM to inspect.                                                                              |

---

## Communication Transports

### 1. WebExtension Runtime Messaging (`browser.runtime`)

- **API**: `browser.runtime.sendMessage(message)` and `browser.runtime.onMessage.addListener(...)`.
- **Primary Use Cases**:
  - Content scripts asking the background service worker to inject `inplace-viewer.content.ts` (`REQUEST_VIEWER_INJECTION`).
  - Content scripts requesting full tab redirection when the page is CSP-sandboxed (`REQUEST_VIEWER_REDIRECT`).
  - Viewers requesting the background script to fetch remote HTTP/HTTPS source code with origin headers and CORS bypass (`FETCH_SOURCE`).
  - Viewers delegating navigation to the browser's native `view-source:` viewer (`OPEN_NATIVE`).
- **Characteristics**:
  - Asynchronous promise-based request/response.
  - Sender metadata (`sender.tab.id`) automatically provided to the background listener.
  - Background listener returns a `Promise` resolving to the payload.

### 2. Window Messaging (`window.postMessage`)

- **API**: `window.postMessage(message, '*')` and `window.addEventListener('message', handler)`.
- **Primary Use Cases**:
  - Closing the in-place viewer from the viewer toolbar (`CLOSE_INPLACE_VIEWER`).
  - Requesting host page DOM text extraction for local files in the in-place viewer (`REQUEST_INPLACE_LOCAL_SOURCE` $\rightarrow$ `INPLACE_LOCAL_SOURCE_DATA`).
- **Why this is needed**:
  - The in-place viewer iframe runs in an extension origin (`chrome-extension://<id>`), while the host document runs in the page origin or `file://`.
  - Same-Origin Policy forbids direct DOM access across these origins (`iframe.contentWindow.document` or `window.parent.document` throws cross-origin security errors).
  - MV3 Service Workers cannot read `file://` URLs. The host page content script (`inplace-viewer.content.ts`) has direct read access to the host document DOM (`extractHostSource()`). The iframe requests this text across the window boundary via `window.parent.postMessage`.

### 3. Direct Extension Fetching

- **API**: Standard `window.fetch(url)`.
- **Usage**:
  - **Standalone `viewer.html`**: When opened as a top-level tab for a `file:///` URL (with granted file access) or a font URL, the extension origin has permission to fetch the resource directly (and pass font buffers to `new FontFace()`).

### 4. Storage & Persistence

- **`browser.storage.local`**: Global extension preferences (theme, word wrap, font size, `openIn` preference, `contextMenu`).
- **`browser.storage.session`**: In-memory session store managed by the background script to hold captured host tab source payloads keyed by viewer tab ID (`viewer:tab:<id>`), enabling seamless source transfer to standalone viewer tabs and live tab refresh.
- **`sessionStorage`**: In-memory tab-scoped snapshot storage for standalone local files dropped into the viewer or selected via file picker without a persistent URL. Ensures F5 reloads preserve the active document.
- **IndexedDB (`directory-store`)**: Client-side storage storing loaded directory file entries (`DirectoryStoreFile`: path, name, type, size, text, buffer) and active navigation state, enabling automatic restoration of local directory projects across sessions.

---

## Key Workflows & Sequence Diagrams

### Workflow 1: In-Place Interception & Remote Fetching (HTTP/HTTPS)

When a user browses directly to a raw JavaScript, CSS, JSON, or XML file on the web:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Page as Browser Tab (Host Page)
    participant CS as content.ts
    participant SW as background.ts
    participant InPlaceCS as inplace-viewer.content.ts
    participant Iframe as viewer.html (Iframe)
    participant Remote as Remote Web Server

    User->>Page: Navigate to https://example.com/app.js
    Page->>CS: document_start
    CS->>CS: detectRedirectFileType(document.contentType, url)
    Note over CS: Matches JS/CSS/JSON/XML
    CS->>Page: Inject hide style (:root { visibility: hidden !important })
    CS->>SW: browser.runtime.sendMessage({ type: 'REQUEST_VIEWER_INJECTION', url })
    SW->>InPlaceCS: browser.scripting.executeScript(tabId, 'inplace-viewer.js')
    SW-->>CS: { inject: true }
    InPlaceCS->>Page: Inject iframe[src="viewer.html?url=https://example.com/app.js"]
    InPlaceCS->>Page: Update favicon (setInplaceFavicon)
    Page->>Iframe: Load viewer application
    Iframe->>Iframe: useSourceFetch.load()
    Iframe->>SW: browser.runtime.sendMessage({ type: 'FETCH_SOURCE', url })
    SW->>Remote: fetch(url, { credentials: 'include' })
    Remote-->>SW: HTTP 200 (binary stream & headers)
    SW->>SW: decodeBytes(buffer, contentType)
    SW-->>Iframe: FetchSourceResponse (text, contentType, byteLength, status)
    Iframe->>Iframe: CodeMirror format & render
    Note over Iframe: In-place viewer is fully interactive!
```

---

### Workflow 2: In-Place DOM Extraction & Content-Type Propagation

When a user navigates to a local source file (`file:///path/to/script.js`) or an API response rendered directly in the tab (e.g. JSON without a `.json` extension):
_Background service workers in MV3 are forbidden from fetching `file://` URLs, and direct API navigations use DOM extraction. The iframe delegates reading to the host content script, which also forwards `document.contentType` to ensure proper syntax highlighting and formatting._

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Page as Browser Tab (file:// or API URL)
    participant CS as content.ts
    participant SW as background.ts
    participant InPlaceCS as inplace-viewer.content.ts
    participant Iframe as viewer.html (Iframe)

    User->>Page: Open file:///.../script.js or API URL
    Page->>CS: document_start
    CS->>CS: detectRedirectFileType(document.contentType, url)
    CS->>Page: Inject hide style
    CS->>SW: browser.runtime.sendMessage({ type: 'REQUEST_VIEWER_INJECTION' })
    SW->>InPlaceCS: browser.scripting.executeScript()
    InPlaceCS->>Page: Create iframe[src="viewer.html?url=..."]
    Page->>Iframe: Initialize Viewer App
    Iframe->>Iframe: Detected window.self !== window.top (in-place iframe)
    Iframe->>InPlaceCS: window.parent.postMessage({ type: 'REQUEST_INPLACE_LOCAL_SOURCE' }, '*')
    InPlaceCS->>Page: extractHostSource() (reads pre/DOM text)
    InPlaceCS->>Iframe: iframe.contentWindow.postMessage({ type: 'INPLACE_LOCAL_SOURCE_DATA', text, contentType }, '*')
    Iframe->>Iframe: applyCodePayload() (maps contentType to language, e.g. JSON)
    Iframe->>Iframe: formatSource & render CodeMirror
    Note over Iframe: Source rendered and formatted in-place with authentic MIME type!
```

---

### Workflow 3: CSP Sandbox Fallback (Tab Redirection)

When a host page delivers a Content Security Policy with `sandbox` (such as `raw.githubusercontent.com`), the host document has an opaque origin (`window.origin === 'null'`). Any embedded extension iframe would be sandboxed, disabling script execution. The extension detects this and performs a full tab redirection instead:

```mermaid
sequenceDiagram
    autonumber
    participant CS as content.ts
    participant SW as background.ts
    participant Tab as browser.tabs

    CS->>CS: Detect window.origin === 'null'
    CS->>SW: browser.runtime.sendMessage({ type: 'REQUEST_VIEWER_REDIRECT', url })
    SW->>Tab: browser.tabs.update(tabId, { url: viewerUrl(url) })
    Tab->>Tab: Navigate whole tab to chrome-extension://.../viewer.html?url=...
```

---

### Workflow 4: Explicit Actions & View-Source Interception

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser as Browser UI
    participant SW as background.ts
    participant Tab as Browser Tab
    participant Viewer as viewer.html

    alt User clicks Extension Toolbar Icon
        User->>Browser: Click extension action icon
        Browser->>SW: browser.action.onClicked(tab)
        SW->>SW: openSourceViewer(tab.url, tab.id)
        SW->>Tab: Create or update tab with viewerUrl
    else User clicks Context Menu "View source with Source Viewer"
        User->>Browser: Right click -> "View source with Source Viewer"
        Browser->>SW: browser.contextMenus.onClicked(info, tab)
        SW->>SW: openSourceViewer(targetUrl)
        SW->>Tab: Open viewer tab
    else Navigation to view-source: URL
        User->>Browser: Navigates to view-source:https://example.com
        Browser->>SW: browser.tabs.onUpdated(status === 'loading')
        alt If tab allowed by NativeViewerController
            SW->>SW: Let request proceed natively
        else Default
            SW->>Tab: browser.tabs.update(tabId, { url: viewerUrl(...) })
        end
    else User toggles "Native Viewer" inside Source Viewer
        User->>Viewer: Click "Native Viewer" button
        Viewer->>SW: browser.runtime.sendMessage({ type: 'OPEN_NATIVE', url, newTab })
        SW->>SW: nativeViewer.open(url) -> registers tab in allowed Set
        SW->>Tab: browser.tabs.update(tabId, { url: 'view-source:' + url })
    end
```

---

### Workflow 5: Local File Picking, Dropping, & Snapshot Persistence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Viewer as viewer.html (Standalone)
    participant FS as File System Access API / File API
    participant Storage as sessionStorage
    participant VFS as Virtual File System (VFS Tree)

    alt Drag & Drop files/folder or File Picker
        User->>Viewer: Drops files or selects via File Picker
        Viewer->>FS: Read File / FileSystemDirectoryHandle
        Viewer->>VFS: Build in-memory VFS Tree
        Viewer->>Storage: saveSnapshot(fileName, text, fileType)
        Viewer->>Viewer: CodeMirror format & render
    else User presses F5 / Refresh
        User->>Viewer: Reload page
        Viewer->>Storage: getStoredSnapshot()
        Storage-->>Viewer: Stored document payload & timestamp
        Viewer->>Viewer: Restore code, language, and banner status
    end
```

---

### Workflow 6: Local Directory Projects & Virtual File System (VFS) Exploration

When a user loads an entire directory of files (via folder picker or folder drop):
_Files and subdirectories are parsed into an in-memory VFS tree. Directory files and navigation state are persisted in IndexedDB, and link clicks inside the viewer navigate directly between local files without reloading the extension._

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Viewer as viewer.html (useLocalDirectory)
    participant IDB as IndexedDB (directory-store)
    participant Sidebar as useReferenceSidebar (VFS)
    participant Code as CodeView / FontView

    User->>Viewer: Pick folder or drop directory
    Viewer->>Viewer: Read File entries (text / arrayBuffer for fonts)
    Viewer->>IDB: setDirectoryFiles(rootName, files)
    Viewer->>Sidebar: buildDirectoryVfsTree(files, rootName)
    Sidebar->>Viewer: Resolve default entrypoint (e.g. index.html)
    Viewer->>Code: Render entrypoint file

    alt User clicks file link in code or sidebar node
        User->>Code: Click relative link (e.g. ./styles/theme.css)
        Code->>Viewer: useViewerNavigationResolver.onLinkClick()
        Viewer->>Sidebar: revealAndLoadLocalFile('styles/theme.css')
        Sidebar->>Sidebar: Highlight & expand active tree node
        Viewer->>Code: Load file content from local directory store
    else User reloads page (F5)
        User->>Viewer: Reload tab without URL param
        Viewer->>IDB: restoreDirectory()
        IDB-->>Viewer: Restored files, rootName & activePath
        Viewer->>Sidebar: Rebuild VFS tree & restore active document
    end
```

---

### Workflow 7: Multi-View Switching (Code vs Fonts)

When navigating to a font resource or switching views in `viewer.html`:
_Fonts are rendered in a dedicated visual font tester (`FontView`) rather than CodeMirror, sharing a unified toolbar and status bar that dynamically adapt controls._

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Resolver as resolver.ts
    participant Pipeline as useSourceFetch.ts
    participant Toolbar as Toolbar.vue
    participant View as FontView / CodeView

    User->>Pipeline: load(fontUrl)
    Pipeline->>Resolver: resolveFetchStrategy(target)
    Resolver-->>Pipeline: fontFetchStrategy (or directoryFileStrategy)
    Pipeline->>Pipeline: fetch arrayBuffer & fontLoad.loadFromBuffer()
    Pipeline->>Pipeline: set resourceType = 'font'
    Pipeline->>Toolbar: Updates controls (shows Copy URL, font preview size)
    Pipeline->>View: Mounts FontView (family, glyphs, sample text)

    alt User clicks Copy URL
        User->>Toolbar: Click "Copy URL"
        Toolbar->>Toolbar: copy(targetUrl) -> transient copied state (2s)
        Toolbar->>User: Displays checkmark icon & "Copied!" feedback
    end
```

---

## Message Contracts Reference

### Runtime Messages (`browser.runtime`)

| Message Type               | Direction                             | Payload Interface                                                                               | Response Interface                                                                                                                               | Description                                                                                                           |
| :------------------------- | :------------------------------------ | :---------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| `FETCH_SOURCE`             | Viewer $\rightarrow$ Background       | `FetchSourceRequest`<br>`{ type: 'FETCH_SOURCE', url: string }`                                 | `FetchSourceResponse`<br>`{ ok: true, text, contentType, contentDisposition, byteLength, httpStatus, httpStatusText }` \| `{ ok: false, error }` | Fetches remote source through background to avoid CORS / host CSP restrictions. Decodes raw bytes using page charset. |
| `REQUEST_VIEWER_INJECTION` | `content.ts` $\rightarrow$ Background | `RequestViewerInjectionRequest`<br>`{ type: 'REQUEST_VIEWER_INJECTION', url: string }`          | `RequestViewerInjectionResponse`<br>`{ inject: boolean }`                                                                                        | Requests dynamic injection of `inplace-viewer.content.ts` into the sender tab.                                        |
| `REQUEST_VIEWER_REDIRECT`  | `content.ts` $\rightarrow$ Background | `RequestViewerRedirectRequest`<br>`{ type: 'REQUEST_VIEWER_REDIRECT', url: string }`            | `void`                                                                                                                                           | Requests full tab navigation to `viewer.html` when host page is CSP-sandboxed.                                        |
| `OPEN_NATIVE`              | Viewer $\rightarrow$ Background       | `OpenNativeRequest`<br>`{ type: 'OPEN_NATIVE', url: string, newTab: boolean }`                  | `OpenNativeResponse`<br>`{ ok: true }` \| `{ ok: false, error }`                                                                                 | Whitelists target tab in `NativeViewerController` and opens `view-source:<url>` without interception.                 |
| `GET_SESSION_SOURCE`       | Viewer $\rightarrow$ Background       | `GetSessionSourceRequest`<br>`{ type: 'GET_SESSION_SOURCE' }`                                   | `GetSessionSourceResponse`<br>`{ source: SessionSourcePayload \| null, sourceTabClosed?: boolean }`                                              | Retrieves authentic captured source payload stored in `browser.storage.session` for the sender viewer tab.            |
| `REFRESH_TAB_SOURCE`       | Viewer $\rightarrow$ Background       | `RefreshTabSourceRequest`<br>`{ type: 'REFRESH_TAB_SOURCE' }`                                   | `RefreshTabSourceResponse`<br>`{ ok: boolean, source: SessionSourcePayload \| null, sourceTabClosed?: boolean, error?: string }`                 | Re-captures source from original source tab if still open and updates `browser.storage.session`.                      |
| `TAB_SOURCE_CAPTURED`      | Content Script $\rightarrow$ SW       | `TabSourceCapturedMessage`<br>`{ type: 'TAB_SOURCE_CAPTURED', result: TabSourceCaptureResult }` | `void`                                                                                                                                           | Injected `tab-capture.js` sends captured cache/DOM source payload back to background script.                          |

### Window Messages (`window.postMessage`)

| Message Type                   | Direction                          | Payload Schema                                                                                                          | Description                                                                                                                                             |
| :----------------------------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CLOSE_INPLACE_VIEWER`         | Iframe $\rightarrow$ Parent Window | `{ type: 'CLOSE_INPLACE_VIEWER' }`                                                                                      | Dispatched by toolbar close button. Prompts `inplace-viewer.content.ts` to remove iframe, restore favicon, and unhide host DOM.                         |
| `REQUEST_INPLACE_LOCAL_SOURCE` | Iframe $\rightarrow$ Parent Window | `{ type: 'REQUEST_INPLACE_LOCAL_SOURCE' }`                                                                              | Sent by iframe when loading a `file://` URL or direct navigation in-place. Requests DOM extraction from `inplace-viewer.content.ts`.                    |
| `INPLACE_LOCAL_SOURCE_DATA`    | Parent Window $\rightarrow$ Iframe | `{ type: 'INPLACE_LOCAL_SOURCE_DATA', text: string, contentType?: string, isDomFallback?: boolean, byteSize?: number }` | Response carrying extracted host DOM string, original `document.contentType`, and byte size back into the viewer iframe for authentic language mapping. |

---

## Architectural Considerations & Constraints

1. **Manifest V3 Service Worker Lifecycle**:
   - The background service worker can become inactive at any time when idle.
   - All state must be stateless or reconstituted per request. The only in-memory background state is `NativeViewerController`'s transient `allowed` tab ID set, which is short-lived during direct navigation transitions.
2. **Local File Permissions (`file://`)**:
   - In Chromium and Firefox, extensions cannot access `file://` URLs unless the user explicitly checks "Allow access to file URLs" in `chrome://extensions` or `about:addons`.
   - The extension proactively verifies access via `browser.extension.isAllowedFileSchemeAccess()`. If disabled, it displays actionable instructions (`fileSchemePermissionHelp`).
3. **Double Interception Prevention**:
   - `content.ts` specifically ignores `.html` and `.htm` on `file://` so developers editing local web pages are not disrupted.
   - `nativeViewer.ts` manages a one-shot allowance set to avoid endless redirect loops between `view-source:` and `viewer.html`.
4. **Namespace Correctness**:
   - In XML documents (such as `.rss` or `.xml`), `document.createElement('style')` creates an inert element with a null namespace. All dynamically created DOM elements (`<style>`, `<iframe>`) in content scripts use `document.createElementNS('http://www.w3.org/1999/xhtml', ...)`.
