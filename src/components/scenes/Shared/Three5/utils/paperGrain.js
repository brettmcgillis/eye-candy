import { CanvasTexture, NoColorSpace, RepeatWrapping } from 'three';

import { makeRng } from './paintStyle';

export default function paperGrain(seed, strength) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const rng = makeRng(seed);
  const image = ctx.createImageData(256, 256);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 255 - rng() * 100 * strength;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  ctx.strokeStyle = `rgba(80,65,43,${strength * 0.25})`;
  ctx.lineWidth = 0.65;
  for (let i = 0; i < 1700; i += 1) {
    const x = rng() * 256;
    const y = rng() * 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + rng() * 9 - 4.5, y + rng() * 4 - 2);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = NoColorSpace;
  texture.channel = 1;
  return { canvas, texture };
}
