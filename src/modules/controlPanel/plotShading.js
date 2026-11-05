import {
  distance2,
  imagePalette,
  inkLayers,
  inkMap,
  inkMask,
  lab,
  nearestInk,
  penPx,
  plotLayer,
  shadePath,
  stretchTone,
} from '@modules/plotKit';

export default function shadePanelSvg(svg, { albedo, image, options }) {
  const mask = {
    covered: albedo.covered,
    width: albedo.width,
    height: albedo.height,
  };
  const palette = imagePalette({
    image: albedo,
    mask,
    k: options.svgColors || 12,
  });
  if (!palette.length) return svg;
  const paper = options.svgPaper ?? '#ffffff';
  const paperLab = lab(
    ...[1, 3, 5].map((i) => parseInt(paper.slice(i, i + 2), 16))
  );
  const inks = palette.map((ink) => {
    const rgb = [1, 3, 5].map((i) => parseInt(ink.color.slice(i, i + 2), 16));
    let scale = 1;
    while (
      scale > 0.05 &&
      distance2(lab(rgb[0] * scale, rgb[1] * scale, rgb[2] * scale), paperLab) <
        400
    )
      scale -= 0.02;
    return `#${rgb
      .map((v) =>
        Math.round(v * scale)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')}`;
  });
  const nearest = nearestInk(palette);
  let result = svg.replace(/stroke="(#[0-9a-f]{6})"/giu, (_, hex) => {
    const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return `stroke="${inks[nearest(rgb)]}"`;
  });
  const map = inkMap({ image: albedo, mask, palette });
  const pen = penPx(options) ?? options.svgStroke ?? 0.6;
  const extra = palette
    .map((ink, i) => {
      if (options.svgShading === 'none' && !options.svgFill) return '';
      const region = inkMask(map, i, mask);
      const tone = stretchTone({ image, region, keep: 0.35 });
      if (!tone) return '';
      if (options.svgFill) {
        for (let k = 0; k < region.covered.length; k += 1) {
          if (!region.covered[k]) continue; // eslint-disable-line no-continue
          for (let c = 0; c < 3; c += 1)
            tone.data[k * 4 + c] =
              options.svgShading === 'none'
                ? 205
                : Math.min(tone.data[k * 4 + c], 205);
        }
      }
      const d = shadePath({
        angle: options.svgShadeAngle,
        gamma: options.svgShadeGamma,
        width: options.width,
        height: options.height,
        image: tone,
        mask: region,
        pen,
        pixelRatio: albedo.width / options.width,
        shading:
          options.svgShading === 'none' ? 'crosshatch' : options.svgShading,
        spacing: Math.max(options.svgShadeSpacing ?? 6, pen * 2),
      });
      return d ? plotLayer(i, `panel ink ${i + 1}`, pen, d, inks[i]) : '';
    })
    .join('');
  result = result.replace('</svg>', `${extra}</svg>`);
  return inkLayers(result, palette.length).replace(
    /<svg\b/u,
    `<svg style="background-color:${paper}"`
  );
}
