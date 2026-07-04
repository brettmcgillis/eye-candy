// Renders the scene text into an offscreen canvas and exposes a bilinear
// sampler over its coverage (0 = open ground, 1 = inside a letter). The
// canvas blur radius controls how soft the carved walls are.

const MASK_SIZE = 1024;

function makeEmptySampler() {
  return { sample: () => 0 };
}

export default function renderTextMask({
  text,
  fontFamily,
  fontWeight,
  textScale,
  letterSpacing,
  edgeSoftness,
  textRotation,
}) {
  const lines = `${text ?? ''}`
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return makeEmptySampler();
  }

  const canvas = document.createElement('canvas');
  canvas.width = MASK_SIZE;
  canvas.height = MASK_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, MASK_SIZE, MASK_SIZE);

  // Measure at a probe size, then scale the font so the longest line fills
  // `textScale` of the canvas width (and the block fits vertically too).
  const probe = 100;
  ctx.font = `${fontWeight} ${probe}px ${fontFamily}`;
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${letterSpacing * probe}px`;
  }
  const maxWidth = Math.max(
    ...lines.map((line) => ctx.measureText(line).width),
    1
  );
  const lineHeight = 1.12;
  const fitWidth = (MASK_SIZE * textScale) / maxWidth;
  const fitHeight =
    (MASK_SIZE * textScale) / (lines.length * lineHeight * probe);
  const fontSize = probe * Math.min(fitWidth, fitHeight);

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${letterSpacing * fontSize}px`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.filter = edgeSoftness > 0 ? `blur(${edgeSoftness}px)` : 'none';
  ctx.fillStyle = '#fff';
  const rotation = ((textRotation ?? 0) * Math.PI) / 180;

  const blockHeight = lines.length * lineHeight * fontSize;
  ctx.save();
  ctx.translate(MASK_SIZE / 2, MASK_SIZE / 2);
  ctx.rotate(rotation);
  lines.forEach((line, index) => {
    const y = -blockHeight / 2 + (index + 0.5) * lineHeight * fontSize;
    ctx.fillText(line, 0, y);
  });
  ctx.restore();

  const { data } = ctx.getImageData(0, 0, MASK_SIZE, MASK_SIZE);
  const last = MASK_SIZE - 1;

  // Bilinear sample of the red channel, u/v in 0..1.
  function sample(u, v) {
    const x = Math.min(Math.max(u, 0), 1) * last;
    const y = Math.min(Math.max(v, 0), 1) * last;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, last);
    const y1 = Math.min(y0 + 1, last);
    const fx = x - x0;
    const fy = y - y0;
    const r00 = data[(y0 * MASK_SIZE + x0) * 4];
    const r10 = data[(y0 * MASK_SIZE + x1) * 4];
    const r01 = data[(y1 * MASK_SIZE + x0) * 4];
    const r11 = data[(y1 * MASK_SIZE + x1) * 4];
    const top = r00 + (r10 - r00) * fx;
    const bottom = r01 + (r11 - r01) * fx;
    return (top + (bottom - top) * fy) / 255;
  }

  return { sample };
}
