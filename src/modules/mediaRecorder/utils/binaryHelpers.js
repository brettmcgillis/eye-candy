const textEncoder = new TextEncoder();

export function utf8Bytes(value) {
  return typeof value === 'string' ? textEncoder.encode(value) : value;
}

export function concatBytes(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    out.set(chunk, offset);
    offset += chunk.length;
  });
  return out;
}
