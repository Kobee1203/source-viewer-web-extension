import type { ReferenceEntry } from '@/utils/extractReferences';
import type { FileType } from '@/utils/fileType';

// ---------------------------------------------------------------------------
// Node types
// ---------------------------------------------------------------------------

/** An intermediate path segment (directory) or domain-root folder in the VFS tree. */
export interface VfsFolderNode {
  kind: 'folder';
  /** Label shown in the sidebar (e.g. "blog", "web.resource.org", "content/"). */
  name: string;
  /** Unique key used for deduplication when merging references into the tree. */
  key: string;
  /**
   * Non-null when the folder itself is a navigable URL:
   *   - The root-domain folder (always navigable — points to the initial source)
   *   - Domain-root URLs for external sites (https://ga.com → no path after hostname)
   *   - Trailing-slash directory URLs (https://example.com/path/)
   */
  url: string | null;
  linkTarget: 'source' | 'font' | null;
  children: VfsNode[];
  isExpanded: boolean;
  /**
   * True only for the top-level folder representing the initial (root) source domain.
   * It is always placed first in the sidebar and has a visual separator after it.
   */
  isRootDomain: boolean;
}

/** A concrete file resource in the VFS tree. */
export interface VfsFileNode {
  kind: 'file';
  /** Basename for display (e.g. "rss.xml", "app.js"). */
  name: string;
  /** Absolute URL of the resource. */
  url: string;
  linkTarget: 'source' | 'font';
  fileType: FileType | null;
  /** Number of times this URL appears in the source being scanned. */
  count: number;
  /**
   * Whether the user has navigated to this file and its references have been
   * (or are being) injected into the global VFS tree.
   */
  isExplored: boolean;
  isLoading: boolean;
  /**
   * null  = unknown (not yet explored)
   * true  = has references (chevron stays visible as ▼ after exploration)
   * false = no references (chevron disappears after exploration)
   */
  hasReferences: boolean | null;
  /** Whether direct references under this file node are expanded. */
  isExpanded: boolean;
  /** Direct references extracted from this file when explored. */
  references: ReferenceEntry[];
}

export type VfsNode = VfsFolderNode | VfsFileNode;

// ---------------------------------------------------------------------------
// Insertion
// ---------------------------------------------------------------------------

/**
 * Inserts a single {@link ReferenceEntry} into the virtual file-system tree,
 * building intermediate folder nodes as needed and deduplicating by URL.
 *
 * Tree layout rules:
 *   - Files from the root domain appear inside a top-level root-domain folder
 *     (always expanded, always at index 0, clickable → navigates to rootUrl).
 *   - Files from external domains appear under a `hostname/` folder sorted
 *     alphabetically after the root-domain folder.
 *   - Directory URLs (ending with `/`) and domain-root URLs produce clickable folders.
 *
 * @param rootUrl  Absolute URL of the initial source, used as the root-domain
 *                 folder's navigation target. Pass an empty string if not yet known.
 */
export function insertIntoVfs(
  tree: VfsNode[],
  entry: ReferenceEntry,
  rootHostname: string,
  rootUrl: string = '',
): void {
  let parsed: URL;
  try {
    parsed = new URL(entry.url);
  } catch {
    return;
  }

  const isInternal = parsed.hostname === rootHostname;
  let currentLevel: VfsNode[];

  if (isInternal) {
    // ── Internal file: nest under the root-domain folder ──────────────────
    const rootFolder = findOrCreateRootDomainFolder(tree, rootHostname, rootUrl);
    currentLevel = rootFolder.children;
  } else {
    // ── External domain: find or create the hostname folder ───────────────
    currentLevel = tree;
    const domainKey = parsed.hostname;
    const isRootPath = parsed.pathname === '/' || parsed.pathname === '';

    let domainFolder = findFolder(currentLevel, domainKey);
    if (!domainFolder) {
      domainFolder = {
        kind: 'folder',
        name: parsed.hostname,
        key: domainKey,
        url: isRootPath ? entry.url : null,
        linkTarget: isRootPath ? entry.linkTarget : null,
        children: [],
        isExpanded: false,
        isRootDomain: false,
      };
      insertSorted(currentLevel, domainFolder);
    } else if (isRootPath && !domainFolder.url) {
      domainFolder.url = entry.url;
      domainFolder.linkTarget = entry.linkTarget;
    }

    // Domain-root URL: the folder IS the entry — nothing to nest further.
    if (isRootPath) return;

    currentLevel = domainFolder.children;
  }

  // ── Path segments ─────────────────────────────────────────────────────────
  const rawPath = parsed.pathname;
  const isDirectory = rawPath.endsWith('/');
  const segments = rawPath.split('/').filter(Boolean);

  if (segments.length === 0) return;

  const folderSegments = segments.slice(0, -1);
  const lastSegment = segments[segments.length - 1];

  // Build unique folder keys (always prefixed with hostname so there are no
  // key collisions across different domain folders).
  let pathSoFar = parsed.hostname;

  for (const seg of folderSegments) {
    pathSoFar = `${pathSoFar}/${seg}`;
    let folder = findFolder(currentLevel, pathSoFar);
    if (!folder) {
      folder = {
        kind: 'folder',
        name: seg,
        key: pathSoFar,
        url: null,
        linkTarget: null,
        children: [],
        isExpanded: false,
        isRootDomain: false,
      };
      insertSorted(currentLevel, folder);
    }
    currentLevel = folder.children;
  }

  // ── Last segment: clickable folder (directory URL) or file ───────────────
  if (isDirectory) {
    const dirKey = `${pathSoFar}/${lastSegment}`;
    let folder = findFolder(currentLevel, dirKey);
    if (!folder) {
      folder = {
        kind: 'folder',
        name: `${lastSegment}/`,
        key: dirKey,
        url: entry.url,
        linkTarget: entry.linkTarget,
        children: [],
        isExpanded: false,
        isRootDomain: false,
      };
      insertSorted(currentLevel, folder);
    } else if (!folder.url) {
      folder.url = entry.url;
      folder.linkTarget = entry.linkTarget;
    }
    return;
  }

  // Regular file node — deduplicate by URL.
  const existingFile = currentLevel.find((n): n is VfsFileNode => n.kind === 'file' && n.url === entry.url);
  if (!existingFile) {
    const fileNode: VfsFileNode = {
      kind: 'file',
      name: lastSegment,
      url: entry.url,
      linkTarget: entry.linkTarget,
      fileType: entry.fileType,
      count: entry.count,
      isExplored: false,
      isLoading: false,
      hasReferences: null,
      isExpanded: false,
      references: [],
    };
    insertSorted(currentLevel, fileNode);
  } else {
    existingFile.count = Math.max(existingFile.count, entry.count);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Finds the root-domain folder (marked with `isRootDomain: true`), creating it
 * if it does not yet exist. The root-domain folder is always inserted at index 0.
 */
function findOrCreateRootDomainFolder(tree: VfsNode[], rootHostname: string, rootUrl: string): VfsFolderNode {
  const existing = tree.find((n): n is VfsFolderNode => n.kind === 'folder' && n.isRootDomain);
  if (existing) {
    // Update URL if it wasn't known yet (e.g. seeding happened before rootUrl was set).
    if (!existing.url && rootUrl) {
      existing.url = rootUrl;
      existing.linkTarget = 'source';
    }
    return existing;
  }

  const folder: VfsFolderNode = {
    kind: 'folder',
    name: rootHostname,
    key: rootHostname,
    url: rootUrl || null,
    linkTarget: rootUrl ? 'source' : null,
    children: [],
    isExpanded: true, // root-domain folder starts open so its files are immediately visible
    isRootDomain: true,
  };

  // Always at position 0.
  tree.unshift(folder);
  return folder;
}

function findFolder(nodes: VfsNode[], key: string): VfsFolderNode | undefined {
  return nodes.find((n): n is VfsFolderNode => n.kind === 'folder' && n.key === key);
}

/**
 * Inserts a node maintaining:
 *   1. The root-domain folder always stays at index 0 (never displaced).
 *   2. Other folders before files, alphabetically within each group.
 */
function insertSorted(nodes: VfsNode[], node: VfsNode): void {
  const isNewFolder = node.kind === 'folder';

  // Root-domain folder is always unshifted to position 0 by findOrCreateRootDomainFolder.
  // This function is only called for non-root-domain nodes.
  let insertIndex = nodes.length;

  for (let i = 0; i < nodes.length; i++) {
    const existing = nodes[i];

    // Skip the root-domain folder — it must remain at position 0.
    if (existing.kind === 'folder' && existing.isRootDomain) continue;

    const isExistingFolder = existing.kind === 'folder';

    if (isNewFolder && !isExistingFolder) {
      insertIndex = i;
      break;
    }
    if (isNewFolder === isExistingFolder && node.name.localeCompare(existing.name) < 0) {
      insertIndex = i;
      break;
    }
  }

  nodes.splice(insertIndex, 0, node);
}
