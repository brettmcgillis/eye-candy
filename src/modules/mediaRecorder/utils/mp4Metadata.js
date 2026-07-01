import { concatBytes, utf8Bytes } from './binaryHelpers';

// ISO-BMFF ("box") writer/injector for the classic iTunes-style metadata scheme
// (moov > udta > meta > ilst). Chrome's MediaRecorder produces fragmented MP4
// (ftyp + moov, then a sequence of moof+mdat pairs) — fragment sample offsets
// are relative to each moof, not absolute file offsets, so inserting a udta box
// into the initial moov is safe: nothing after moov needs to shift or be
// re-pointed, only moov's own size field needs to grow.

function box(type, payload) {
  const typeBytes = utf8Bytes(type);
  const size = 8 + payload.length;
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  view.setUint32(0, size, false);
  out.set(typeBytes, 4);
  out.set(payload, 8);
  return out;
}

function textDataAtom(fourCC, text) {
  const dataPayload = concatBytes([
    new Uint8Array([0, 0, 0, 1]), // type indicator: 1 = UTF-8 text
    new Uint8Array([0, 0, 0, 0]), // locale indicator
    utf8Bytes(text),
  ]);
  return box(fourCC, box('data', dataPayload));
}

function buildHdlrBox() {
  const payload = concatBytes([
    new Uint8Array(4), // version + flags
    new Uint8Array(4), // pre_defined
    utf8Bytes('mdir'), // handler_type
    new Uint8Array(12), // reserved
    new Uint8Array(1), // name (empty, null-terminated)
  ]);
  return box('hdlr', payload);
}

function buildUdtaBox(tags) {
  const ilst = box(
    'ilst',
    concatBytes(
      Object.entries(tags).map(([fourCC, text]) => textDataAtom(fourCC, text))
    )
  );
  const meta = box(
    'meta',
    concatBytes([new Uint8Array(4), buildHdlrBox(), ilst])
  );
  return box('udta', meta);
}

function readTopLevelBoxes(bytes) {
  const boxes = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  while (offset + 8 <= bytes.length) {
    const size = view.getUint32(offset, false);
    if (size < 8) return null; // size 0 (to-EOF) / size 1 (64-bit) — unsupported, bail

    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    boxes.push({ type, start: offset, size });
    offset += size;
  }

  return boxes;
}

export default function injectMp4Metadata(bytes, tags) {
  const boxes = readTopLevelBoxes(bytes);
  if (!boxes) throw new Error('[mediaRecorder] unexpected MP4 box layout');

  const moovBox = boxes.find((b) => b.type === 'moov');
  if (!moovBox) throw new Error('[mediaRecorder] moov box not found');

  const udtaBytes = buildUdtaBox(tags);
  const moovEnd = moovBox.start + moovBox.size;

  const out = new Uint8Array(bytes.length + udtaBytes.length);
  out.set(bytes.subarray(0, moovEnd), 0);
  out.set(udtaBytes, moovEnd);
  out.set(bytes.subarray(moovEnd), moovEnd + udtaBytes.length);

  const outView = new DataView(out.buffer);
  outView.setUint32(moovBox.start, moovBox.size + udtaBytes.length, false);

  return out;
}
