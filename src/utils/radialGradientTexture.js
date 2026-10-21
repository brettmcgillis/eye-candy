import { DataTexture } from 'three';

function alphaAt(stops, t) {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i += 1) {
    const [t1, a1] = stops[i];
    if (t <= t1) {
      const [t0, a0] = stops[i - 1];
      return a0 + ((a1 - a0) * (t - t0)) / (t1 - t0 || 1);
    }
  }
  return stops[stops.length - 1][1];
}

// A white canvas radial-gradient sprite built as data, so it needs no DOM
// (the headless renderer has none). Each layer is a gradient at
// (cx, cy) with radius r, all as shares of the size; the first is drawn
// over transparent and the rest added ('lighter'), as the canvas did. Rows
// run bottom-up, as a flipped CanvasTexture samples.
export default function radialGradientTexture(size, layers) {
  const data = new Uint8Array(size * size * 4);
  for (let row = 0; row < size; row += 1) {
    const y = size - 1 - row + 0.5;
    for (let x = 0; x < size; x += 1) {
      let alpha = 0;
      layers.forEach(({ cx = 0.5, cy = 0.5, r, stops }, index) => {
        const t = Math.hypot(x + 0.5 - cx * size, y - cy * size) / (r * size);
        const a = alphaAt(stops, t);
        alpha = index === 0 ? a : Math.min(1, alpha + a);
      });
      const o = (row * size + x) * 4;
      data[o] = 255;
      data[o + 1] = 255;
      data[o + 2] = 255;
      data[o + 3] = Math.round(alpha * 255);
    }
  }
  const texture = new DataTexture(data, size, size);
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
