import {
  composeInks,
  imagePalette,
  inkMap,
  inkMask,
  penPx,
  shadePath,
} from '@modules/plotKit';

const luminance = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const hexLuminance = (hex) =>
  luminance(...[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));

// One ink's region as the grey shadePath reads: a solid base, darker where
// the painting is darker than the ink itself. The ink carries the colour, so
// a pale yellow region is drawn as fully as a navy one.
function regionTone(image, map, ink, palette) {
  const own = hexLuminance(palette[ink].color);
  const data = new Uint8ClampedArray(image.width * image.height * 4);
  for (let i = 0; i < map.ink.length; i += 1) {
    const lum = luminance(
      image.data[i * 4],
      image.data[i * 4 + 1],
      image.data[i * 4 + 2]
    );
    const darkness = Math.min(0.95, Math.max(0.2, 0.55 + (own - lum) * 1.5));
    const grey = Math.round(255 * (1 - darkness));
    data.set([grey, grey, grey, 255], i * 4);
  }
  return { data, height: image.height, width: image.width };
}

// The painting as a pen plot: its render split into `inks` regions (the
// painting's own colours, Ward-merged), each region shaded in its ink by
// regionTone, one layer per ink. The painting fills the frame, so there is
// no outline to draw — the regions are the drawing.
export default function renderPaintingSvg({
  angle = 45,
  gamma = 1,
  height,
  image,
  inks = 5,
  pen = 0.6,
  pixelRatio = 1,
  shading = 'crosshatch',
  spacing = 6,
  stroke = 0.6,
  width,
}) {
  const palette = imagePalette({ image, k: inks, vivid: 1 });
  const map = inkMap({ image, palette });
  const shade = (ink) =>
    shadePath({
      angle,
      gamma,
      height,
      image: regionTone(image, map, ink, palette),
      mask: inkMask(map, ink),
      pen,
      pixelRatio,
      shading,
      spacing,
      width,
    });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `${composeInks(palette, [{ shade }], { stroke })}</svg>`
  );
}

// The render options a plot reads, as renderPaintingSvg's arguments; the
// caller adds the image it captured.
export const plotArgs = (options) => ({
  angle: options.svgShadeAngle,
  gamma: options.svgShadeGamma,
  height: options.height,
  inks: options.svgColors,
  pen: penPx(options) ?? options.svgStroke,
  pixelRatio: options.pixelRatio,
  shading: options.svgShading,
  spacing: options.svgShadeSpacing,
  stroke: options.svgStroke,
  width: options.width,
});
