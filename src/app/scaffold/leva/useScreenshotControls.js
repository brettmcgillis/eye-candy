import { button, useControls } from 'leva';

import { useEffect, useRef } from 'react';

// CRC-32 table for PNG chunk validation
/* eslint-disable no-bitwise */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1)
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
/* eslint-enable no-bitwise */

// Build a single PNG tEXt chunk from a keyword/value pair
// tEXt chunks are Latin-1 encoded — use charCodeAt to avoid UTF-8 double-encoding
/* eslint-disable no-bitwise */
function latin1Encode(str) {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i += 1) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
}
/* eslint-enable no-bitwise */

function makeTextChunk(keyword, value) {
  const kw = latin1Encode(keyword);
  const val = latin1Encode(value);
  // data = keyword + null separator + value
  const data = new Uint8Array(kw.length + 1 + val.length);
  data.set(kw);
  data[kw.length] = 0;
  data.set(val, kw.length + 1);
  // type bytes: 't','E','X','t'
  const type = new Uint8Array([116, 69, 88, 116]);
  const crcInput = new Uint8Array(4 + data.length);
  crcInput.set(type);
  crcInput.set(data, 4);
  // chunk = length(4) + type(4) + data(n) + crc(4)
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length, false);
  chunk.set(type, 4);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(crcInput), false);
  return chunk;
}

// Splice tEXt chunks immediately before the first IDAT chunk
function injectPngMetadata(pngBytes, metadata) {
  const dv = new DataView(pngBytes.buffer, pngBytes.byteOffset);
  let pos = 8; // skip 8-byte PNG signature
  let idatOffset = -1;

  while (pos < pngBytes.length - 8) {
    const len = dv.getUint32(pos, false);
    const type = String.fromCharCode(
      pngBytes[pos + 4],
      pngBytes[pos + 5],
      pngBytes[pos + 6],
      pngBytes[pos + 7]
    );
    if (type === 'IDAT') {
      idatOffset = pos;
      break;
    }
    pos += 12 + len;
  }

  if (idatOffset === -1) {
    throw new Error('[screenshot] PNG IDAT chunk not found');
  }

  const textChunks = Object.entries(metadata).map(([k, v]) =>
    makeTextChunk(k, v)
  );
  const totalTextSize = textChunks.reduce((s, c) => s + c.length, 0);

  const out = new Uint8Array(pngBytes.length + totalTextSize);
  out.set(pngBytes.slice(0, idatOffset));
  let off = idatOffset;
  textChunks.forEach((chunk) => {
    out.set(chunk, off);
    off += chunk.length;
  });
  out.set(pngBytes.slice(idatOffset), off);
  return out;
}

async function captureScreenshot(name, sceneName) {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(document.body, {
    useCORS: true,
    allowTaint: false,
    scale: window.devicePixelRatio,
  });

  canvas.toBlob(async (blob) => {
    let outBlob = blob;

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const enriched = injectPngMetadata(new Uint8Array(arrayBuffer), {
        Artist: 'Brett McGillis',
        Copyright: `\u00a9 ${new Date().getFullYear()} Brett McGillis`,
        Scene: sceneName,
        Software: 'eye-candy',
        Instagram: '@ruinedpaintings',
        'Creation Time': new Date().toISOString(),
      });
      outBlob = new Blob([enriched], { type: 'image/png' });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '[screenshot] metadata injection failed, saving without metadata:',
        err
      );
    }

    const url = URL.createObjectURL(outBlob);
    const link = document.createElement('a');
    link.download = `${name}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function isMobileDevice() {
  return /iP(hone|ad|od)|Android/.test(navigator.userAgent);
}

export default function useScreenshotControls({ sceneName, presetName }) {
  const defaultName = presetName ? `${sceneName} - ${presetName}` : sceneName;
  const nameRef = useRef(defaultName);

  useControls(
    'Screenshot',
    {
      name: {
        label: 'filename',
        value: defaultName,
        onChange: (v) => {
          nameRef.current = v;
        },
      },
      png: button(() => captureScreenshot(nameRef.current, sceneName)),
    },
    { collapsed: true, render: () => !isMobileDevice() }
  );

  // Update screenshot name when preset changes
  useEffect(() => {
    const newName = presetName ? `${sceneName} - ${presetName}` : sceneName;
    nameRef.current = newName;
  }, [presetName, sceneName]);

  // Hotkey: Shift+S — works even when Leva panel is hidden
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key === 'S') {
        e.preventDefault();
        captureScreenshot(nameRef.current, sceneName);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
