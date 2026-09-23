import type { FileType } from '@/utils/fileType';

export type SourceErrorKind = 'restricted' | 'file-access-denied' | 'network' | 'generic';

/**
 * Typed error thrown by strategies or the resolver to represent a blocking
 * failure in source acquisition.
 */
export class SourceFetchError extends Error {
  readonly kind: SourceErrorKind;
  readonly allowNativeFallback: boolean;

  constructor(kind: SourceErrorKind, message: string, allowNativeFallback = false) {
    super(message);
    this.name = 'SourceFetchError';
    this.kind = kind;
    this.allowNativeFallback = allowNativeFallback;
  }
}

/**
 * Represents the target destination or input to acquire source code from.
 */
export type SourceTarget =
  | { kind: 'url'; url: URL; fileAccessDisallowed?: boolean }
  | { kind: 'file'; file: File; handle?: FileSystemFileHandle; isFromSession?: boolean }
  | { kind: 'snapshot' }
  | { kind: 'directory-file'; path: string; url?: URL };

/**
 * Standardized raw source payload returned by all acquisition strategies
 * before language detection, beautification, or view-state hydration.
 */
export interface RawSourcePayload {
  rawText: string;
  byteSize: number;
  mimeType?: string | null;
  fileName?: string | null;
  contentDisposition?: string | null;
  httpStatus?: number | null;
  httpStatusText?: string;
  targetUrl?: URL | null;
  isLocalSnapshot?: boolean;
  snapshotTimestamp?: number | null;
  fileHandle?: FileSystemFileHandle | null;
  detectedFileType?: FileType;
  isDomFallback?: boolean;
  isSourceTabClosed?: boolean;
  isDirectoryFile?: boolean;
}

/**
 * Function contract for an acquisition strategy.
 */
export type SourceFetchStrategy = (target: SourceTarget) => Promise<RawSourcePayload>;

/**
 * High-level status of the source fetching lifecycle.
 */
export type SourceStatus = 'idle' | 'loading' | 'success' | 'error';
