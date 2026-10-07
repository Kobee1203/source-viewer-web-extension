import { eotToTtf } from 'mtx-decompressor';

/** EOT file magic number: 'LP' in little-endian uint16 (0x504C). */
const EOT_MAGIC_NUMBER = 0x504c;

/** Minimum byte length of an Embedded OpenType header (version 1). */
const MIN_EOT_HEADER_SIZE = 82;

/**
 * Checks whether the given buffer represents an Embedded OpenType (.eot) container.
 * EOT files begin with a little-endian EMBEDDEDFONT structure containing the
 * magic number 0x504C at offset 34 and a recognized version identifier at offset 8.
 */
export function isEot(buffer: ArrayBufferLike | ArrayBufferView): boolean {
  if (buffer.byteLength < MIN_EOT_HEADER_SIZE) {
    return false;
  }

  const view = ArrayBuffer.isView(buffer)
    ? new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new DataView(buffer);

  const magic = view.getUint16(34, true);
  if (magic !== EOT_MAGIC_NUMBER) {
    return false;
  }

  const version = view.getUint32(8, true);
  return version === 0x00010000 || version === 0x00020001 || version === 0x00020002;
}

/**
 * Converts an Embedded OpenType (.eot) font buffer into standard TrueType (.ttf) font data
 * that modern browsers can decode via the FontFace API.
 */
export function convertEotToTtf(buffer: ArrayBufferLike | ArrayBufferView): ArrayBuffer {
  const bytes = ArrayBuffer.isView(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new Uint8Array(buffer);
  const ttfBytes = eotToTtf(bytes);
  const copy = new Uint8Array(ttfBytes.byteLength);
  copy.set(ttfBytes);
  return copy.buffer;
}
