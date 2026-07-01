import { concatBytes, utf8Bytes } from './binaryHelpers';

// EBML (Matroska/WebM) Tags injector. Chrome's MediaRecorder writes a live/
// streamed WebM whose top-level Segment size is the EBML "unknown size"
// sentinel (all value-bits set to 1) rather than a definite byte count, since
// the muxer can't know the final size in advance. When that's the case, a
// Tags element can simply be appended after the existing bytes — it's a valid
// top-level child of an unknown-size Segment and needs no other byte in the
// file to change. If the size ever turns out to be definite, we bail rather
// than write something a parser would silently ignore.

const EBML_HEADER_ID = [0x1a, 0x45, 0xdf, 0xa3];
const SEGMENT_ID = [0x18, 0x53, 0x80, 0x67];

const ID_TAGS = new Uint8Array([0x12, 0x54, 0xc3, 0x67]);
const ID_TAG = new Uint8Array([0x73, 0x73]);
const ID_TARGETS = new Uint8Array([0x63, 0xc0]);
const ID_SIMPLE_TAG = new Uint8Array([0x67, 0xc8]);
const ID_TAG_NAME = new Uint8Array([0x45, 0xa3]);
const ID_TAG_STRING = new Uint8Array([0x44, 0x87]);

function matchesId(bytes, offset, id) {
  return id.every((b, i) => bytes[offset + i] === b);
}

// EBML variable-length integers: the position of the first set bit (from the
// MSB) of the first byte determines the total length (1-8 bytes); the value
// occupies the remaining bits of that byte plus all bits of the rest.
/* eslint-disable no-bitwise */
function readVintHeader(byte) {
  let marker = 0x80;
  let length = 1;
  while (length <= 8 && !(byte & marker)) {
    marker >>= 1;
    length += 1;
  }
  return length > 8 ? null : { length, marker };
}

function readVintValue(bytes, offset, { length, marker }) {
  let value = bytes[offset] & (marker - 1);
  for (let i = 1; i < length; i += 1) {
    value = value * 256 + bytes[offset + i];
  }
  return value;
}

function isUnknownSizeVint(bytes, offset, { length, marker }) {
  if ((bytes[offset] & (marker - 1)) !== marker - 1) return false;
  for (let i = 1; i < length; i += 1) {
    if (bytes[offset + i] !== 0xff) return false;
  }
  return true;
}

// Smallest-length definite-size VINT encoder (all value-bits-1 is reserved
// for "unknown size", so each length n can hold up to 2^(7n) - 2).
function encodeEbmlSize(value) {
  let n = 1;
  while (n < 8 && value > 2 ** (7 * n) - 2) n += 1;

  const bytes = new Uint8Array(n);
  let remaining = value;
  for (let i = n - 1; i >= 0; i -= 1) {
    bytes[i] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }
  bytes[0] |= 0x80 >> (n - 1);
  return bytes;
}
/* eslint-enable no-bitwise */

function ebmlElement(idBytes, payload) {
  return concatBytes([idBytes, encodeEbmlSize(payload.length), payload]);
}

function buildSimpleTag(name, value) {
  return ebmlElement(
    ID_SIMPLE_TAG,
    concatBytes([
      ebmlElement(ID_TAG_NAME, utf8Bytes(name)),
      ebmlElement(ID_TAG_STRING, utf8Bytes(value)),
    ])
  );
}

function buildTagsElement(tags) {
  const targets = ebmlElement(ID_TARGETS, new Uint8Array(0)); // whole-file scope
  const simpleTags = Object.entries(tags).map(([name, value]) =>
    buildSimpleTag(name, value)
  );
  const tag = ebmlElement(ID_TAG, concatBytes([targets, ...simpleTags]));
  return ebmlElement(ID_TAGS, tag);
}

export default function injectWebmMetadata(bytes, tags) {
  if (!matchesId(bytes, 0, EBML_HEADER_ID)) {
    throw new Error('[mediaRecorder] not an EBML/WebM file');
  }

  const headerSizeHeader = readVintHeader(bytes[4]);
  if (!headerSizeHeader) {
    throw new Error('[mediaRecorder] unreadable EBML header size');
  }
  const headerSize = readVintValue(bytes, 4, headerSizeHeader);
  const segmentStart = 4 + headerSizeHeader.length + headerSize;

  if (!matchesId(bytes, segmentStart, SEGMENT_ID)) {
    throw new Error('[mediaRecorder] Segment element not found where expected');
  }

  const segmentSizeOffset = segmentStart + 4;
  const segmentSizeHeader = readVintHeader(bytes[segmentSizeOffset]);
  if (!segmentSizeHeader) {
    throw new Error('[mediaRecorder] unreadable Segment size');
  }
  if (!isUnknownSizeVint(bytes, segmentSizeOffset, segmentSizeHeader)) {
    throw new Error(
      '[mediaRecorder] Segment has a definite size — unsafe to append Tags'
    );
  }

  return concatBytes([bytes, buildTagsElement(tags)]);
}
