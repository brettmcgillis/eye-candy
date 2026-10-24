import { penPx, shadePath } from '@modules/plotKit';

export default function ornamentShading({
  coloring,
  coverage,
  height,
  image,
  options,
  ornaments,
  width,
}) {
  if (
    !coloring ||
    !image ||
    !ornaments ||
    !coverage ||
    options.svgShading === 'none'
  )
    return '';
  const { map, palette } = coloring;
  const ratio = image.width / width;
  const size = image.width * image.height;
  const owner = map.ink;
  const visible = new Uint8Array(size);
  const luma = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    visible[i] =
      ornaments.covered[i] &&
      coverage.covered[i] &&
      ornaments.data[i] <= coverage.data[i] + coverage.tolerance
        ? 1
        : 0;
    luma[i] =
      (0.2126 * image.data[i * 4] +
        0.7152 * image.data[i * 4 + 1] +
        0.0722 * image.data[i * 4 + 2]) /
      255;
  }
  const pen = penPx(options) ?? 0.6;
  return palette
    .map(({ color }, ink) => {
      const values = [];
      for (let i = 0; i < size; i += 1)
        if (visible[i] && owner[i] === ink) values.push(luma[i]);
      if (!values.length) return '';
      values.sort((a, b) => a - b);
      const low = values[Math.floor(values.length * 0.02)];
      const high = values[Math.floor(values.length * 0.98)];
      const span = Math.max(high - low, 0.15);
      const data = new Uint8ClampedArray(size * 4);
      const covered = new Uint8Array(size);
      for (let i = 0; i < size; i += 1) {
        if (visible[i] && owner[i] === ink) {
          const light = Math.max(
            0,
            Math.min(1, (luma[i] - high + span) / span)
          );
          const value = (0.42 + 0.58 * light) * 255;
          data[i * 4] = value;
          data[i * 4 + 1] = value;
          data[i * 4 + 2] = value;
          data[i * 4 + 3] = 255;
          covered[i] = 1;
        }
      }
      const d = shadePath({
        angle: options.svgShadeAngle,
        gamma: options.svgShadeGamma,
        height,
        image: { data, height: image.height, width: image.width },
        mask: { covered, height: image.height, width: image.width },
        pen,
        pixelRatio: ratio,
        shading: options.svgShading,
        spacing: Math.max(options.svgShadeSpacing, pen * 2),
        width,
      });
      return d
        ? `<g id="ornament-shade-${ink + 1}" fill="none" stroke="${color}" stroke-width="${pen.toFixed(2)}" stroke-linecap="round"><path d="${d}"/></g>`
        : '';
    })
    .join('');
}
