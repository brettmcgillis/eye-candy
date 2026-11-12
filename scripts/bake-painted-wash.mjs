/* eslint-disable no-console */
import { writeFile } from 'node:fs/promises';

import createBrowser from './lib/cumulusBrowser.mjs';

const browser = await createBrowser(
  {},
  { api: 'paintedWashBake', entry: 'scripts/lib/paintedWashBake.js' }
);
try {
  const { width, height, data, debug } = await browser.capture();
  console.log(debug);
  const range = [
    data.reduce((a, b) => Math.min(a, b), 255),
    data.reduce((a, b) => Math.max(a, b), 0),
  ];
  if (range[0] === range[1]) throw new Error(`Native wash is flat: ${range}`);
  const tile = width / 4;
  const packed = new Uint8Array(width * height * 4);
  for (let t = 0; t < 32; t += 1) {
    const at = (x, y) =>
      (Math.floor(t / 4) * tile + y) * width + (t % 4) * tile + x;
    const distance = (inside) => {
      const out = Float32Array.from({ length: tile * tile }, (_, i) =>
        data[at(i % tile, Math.floor(i / tile))] > 3 === inside ? 1e4 : 0
      );
      for (let y = 0; y < tile; y += 1)
        for (let x = 0; x < tile; x += 1) {
          const i = y * tile + x;
          if (x) out[i] = Math.min(out[i], out[i - 1] + 1);
          if (y) out[i] = Math.min(out[i], out[i - tile] + 1);
          if (x && y) out[i] = Math.min(out[i], out[i - tile - 1] + Math.SQRT2);
          if (x < tile - 1 && y)
            out[i] = Math.min(out[i], out[i - tile + 1] + Math.SQRT2);
        }
      for (let y = tile - 1; y >= 0; y -= 1)
        for (let x = tile - 1; x >= 0; x -= 1) {
          const i = y * tile + x;
          if (x < tile - 1) out[i] = Math.min(out[i], out[i + 1] + 1);
          if (y < tile - 1) out[i] = Math.min(out[i], out[i + tile] + 1);
          if (x < tile - 1 && y < tile - 1)
            out[i] = Math.min(out[i], out[i + tile + 1] + Math.SQRT2);
          if (x && y < tile - 1)
            out[i] = Math.min(out[i], out[i + tile - 1] + Math.SQRT2);
        }
      return out;
    };
    const inside = distance(true);
    const outside = distance(false);
    for (let y = 0; y < tile; y += 1)
      for (let x = 0; x < tile; x += 1) {
        const p = at(x, y);
        const signed = inside[y * tile + x] - outside[y * tile + x];
        let sum = 0;
        let n = 0;
        for (let dy = -3; dy <= 3; dy += 1)
          for (let dx = -3; dx <= 3; dx += 1) {
            sum +=
              data[
                at(
                  Math.min(tile - 1, Math.max(0, x + dx)),
                  Math.min(tile - 1, Math.max(0, y + dy))
                )
              ];
            n += 1;
          }
        packed.set(
          [
            data[p],
            Math.min(255, Math.max(0, Math.round(128 + signed * 8))),
            Math.min(255, Math.max(0, Math.round((data[p] - sum / n) * 5))),
            255,
          ],
          p * 4
        );
      }
  }
  await writeFile(
    new URL('../src/modules/paintedRender/wash.json', import.meta.url),
    `${JSON.stringify(
      {
        source:
          'LoaderPatterns watercolor recipe, shared watercolorStages; p5.brush 3.0.0; seeds 3801 + tile*977 + pass*131; RGBA: native density, signed edge distance, pigment pooling, opaque',
        width,
        height,
        tiles: 32,
        columns: 4,
        rows: 8,
        squareTiles: 16,
        data: Buffer.from(packed).toString('base64'),
      },
      null,
      2
    )}\n`
  );
  console.log(
    'Baked sixteen square and sixteen triangular native watercolor marks, retaining their bleed, evaporation edges and three nested passes.'
  );
} finally {
  await browser.dispose();
}
