import { Color } from 'three';

import { unmatteInk } from './canvasOutputs';
import { configureBrush, configureFill, makeRng } from './paintStyle';

export async function pigmentAssets(runtime, config) {
  const rng = makeRng(config.seed);
  const shapes = Array.from({ length: config.washCount }, () => {
    const x = 140 + rng() * 480;
    const y = 140 + rng() * 480;
    return Array.from({ length: 8 }, (_, j) => {
      const angle = (j / 8) * Math.PI * 2;
      return [x + Math.cos(angle) * 190, y + Math.sin(angle) * 125];
    });
  });
  const paint = (polygon, color) => (brush) => {
    configureBrush(brush, config);
    configureFill(brush, { ...config, hatchEnabled: false }, color);
    brush.noStroke();
    brush.polygon(polygon);
  };
  const passes = shapes.map((shape, i) =>
    paint(shape, i % 2 ? config.pigmentB : config.pigment)
  );
  const main = await runtime.paint(
    config.dryLayers
      ? passes
      : [(brush) => passes.forEach((pass) => pass(brush))],
    config
  );
  if (!main) return null;
  const coverage = document.createElement('canvas');
  coverage.width = main.width;
  coverage.height = main.height;
  const ctx = coverage.getContext('2d');
  const image = ctx.createImageData(main.width, main.height);
  const deposits = new Float32Array(main.width * main.height);
  const layers = await Promise.all(
    shapes.map(async (shape) => {
      const layer = await runtime.paint(
        [paint(shape, '#000000')],
        config,
        true
      );
      if (!layer) return false;
      unmatteInk(layer, '#000000');
      const pixels = layer
        .getContext('2d')
        .getImageData(0, 0, layer.width, layer.height).data;
      for (let i = 0; i < deposits.length; i += 1)
        deposits[i] += pixels[i * 4 + 3] / 255;
      return true;
    })
  );
  if (layers.some((layer) => !layer)) return null;
  for (let i = 0; i < deposits.length; i += 1) {
    const value = Math.min(255, deposits[i] * 130);
    image.data[i * 4] = value;
    image.data[i * 4 + 1] = value;
    image.data[i * 4 + 2] = value;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return { main, coverage };
}

export async function particleStamp(runtime, config) {
  const kind = config.particleKind;
  if (kind === 'leaves') return null;
  const stamp = await runtime.paint(
    [
      (brush) => {
        const brushName = kind === 'spray' ? 'spray' : 'pastel';
        const style = {
          ...config,
          brush: brushName,
          brushScale: kind === 'pollen' ? 3 : 7,
          strokeWeight: kind === 'pollen' ? 2 : 5,
          ink: config.particleColor,
          sprayInk: 4,
        };
        configureBrush(brush, style);
        const rng = makeRng(config.seed);
        const count = kind === 'pollen' ? 12 : 45;
        for (let i = 0; i < count; i += 1) {
          const radius = Math.sqrt(rng()) * (kind === 'pollen' ? 45 : 230);
          const angle = rng() * Math.PI * 2;
          const x = 384 + Math.cos(angle) * radius;
          const y = 384 + Math.sin(angle) * radius;
          brush.line(x - 10, y, x + 10, y + 3);
        }
      },
    ],
    config,
    true
  );
  if (!stamp) return null;
  unmatteInk(stamp, config.particleColor);
  const ctx = stamp.getContext('2d');
  const pixels = ctx.getImageData(0, 0, stamp.width, stamp.height);
  const tint = new Color(config.particleColor).convertLinearToSRGB();
  for (let y = 0; y < stamp.height; y += 1)
    for (let x = 0; x < stamp.width; x += 1) {
      const i = (y * stamp.width + x) * 4;
      const distance =
        Math.hypot(x / stamp.width - 0.5, y / stamp.height - 0.5) / 0.48;
      pixels.data[i] = tint.r * 255;
      pixels.data[i + 1] = tint.g * 255;
      pixels.data[i + 2] = tint.b * 255;
      pixels.data[i + 3] *= Math.max(0, 1 - distance ** 2);
    }
  ctx.putImageData(pixels, 0, 0);
  return stamp;
}
