import { CanvasTexture, Color, NoColorSpace, SRGBColorSpace } from 'three';

export default function materialMasks(assets, config) {
  const source =
    config.maskSource === 'coverage' ? assets.coverage : assets.height;
  if (!source) return null;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = source.width;
  colorCanvas.height = source.height;
  const colorCtx = colorCanvas.getContext('2d');
  const colors = colorCtx.createImageData(source.width, source.height);
  const paper = new Color(config.paper)
    .convertLinearToSRGB()
    .toArray()
    .map((v) => v * 255);
  const pigment = new Color(config.pigment)
    .convertLinearToSRGB()
    .toArray()
    .map((v) => v * 255);
  const amount = config.maskStrength / 0.6;
  for (let i = 0; i < image.data.length; i += 4) {
    let value = image.data[i] / 255;
    if (config.maskSource === 'luminance') value = 1 - value;
    if (config.maskInvert) value = 1 - value;
    for (let channel = 0; channel < 3; channel += 1)
      colors.data[i + channel] =
        paper[channel] + (pigment[channel] - paper[channel]) * value * amount;
    colors.data[i + 3] = 255;
    if (config.maskChannel === 'roughness')
      value = 0.65 + (value - 0.65) * amount;
    image.data[i] = value * 255;
    image.data[i + 1] = value * 255;
    image.data[i + 2] = value * 255;
  }
  ctx.putImageData(image, 0, 0);
  colorCtx.putImageData(colors, 0, 0);
  const mask = new CanvasTexture(canvas);
  mask.colorSpace = NoColorSpace;
  const color = new CanvasTexture(colorCanvas);
  color.colorSpace = SRGBColorSpace;
  return {
    mask,
    color,
    dispose: () => {
      mask.dispose();
      color.dispose();
    },
  };
}
