import {
  distance2,
  imagePalette,
  inkLayers,
  inkMap,
  inkMask,
  lab,
  meshPlotSvg,
  penPx,
  plotLayer,
  shadePath,
} from '@modules/plotKit';

const BLACK = { color: '#000000', lab: lab(0, 0, 0) };
const rgbOf = (color) =>
  [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));

const paperOf = (options) => {
  const rgb = rgbOf(options.svgPaper ?? '#ffffff');
  return { color: options.svgPaper ?? '#ffffff', lab: lab(...rgb) };
};

// One palette for the lines and the shading, without the inks that would
// vanish into the paper.
export function thoughtInks({ albedo, coverage, options }) {
  if (options.svgMonochrome) return [BLACK];
  const paper = paperOf(options).lab;
  const sampled = imagePalette({
    image: albedo,
    k: options.svgColors || 8,
    mask: coverage,
    vivid: 1,
  });
  const kept = sampled.filter(
    (ink) =>
      ink.mass >= 0.01 &&
      distance2(ink.lab, paper) >= (options.svgPaperDistance ?? 0) ** 2
  );
  return kept.length ? kept : sampled.slice(0, 1);
}

// Each pixel takes the commonest ink around it, so texture flecks and
// antialiased rims don't shade as islands of a few hatch specks.
function settleInks(map, radius) {
  const { height, ink, width } = map;
  const settled = new Int16Array(ink.length).fill(-1);
  const votes = new Map();
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1)
      if (ink[y * width + x] >= 0) {
        votes.clear();
        for (let dy = -radius; dy <= radius; dy += 1)
          for (let dx = -radius; dx <= radius; dx += 1) {
            const sx = x + dx;
            const sy = y + dy;
            const at =
              sx >= 0 && sy >= 0 && sx < width && sy < height
                ? ink[sy * width + sx]
                : -1;
            if (at >= 0) votes.set(at, (votes.get(at) ?? 0) + 1);
          }
        let best = ink[y * width + x];
        votes.forEach((count, at) => {
          if (count > votes.get(best)) best = at;
        });
        settled[y * width + x] = best;
      }
  return { height, ink: settled, width };
}

// Subpaths shorter than `minLength` px dropped: the silhouette's loops
// round single pixels of a one-pixel line are pen dabs, not drawing.
function dropSpecks(svg, minLength) {
  return svg.replace(/ d="([^"]*)"/gu, (_, d) => {
    const kept = d.split(/(?=M)/u).filter((part) => {
      const n = (part.match(/-?\d+(?:\.\d+)?/gu) ?? []).map(Number);
      let length = 0;
      for (let i = 2; i + 1 < n.length; i += 2)
        length += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]);
      return length >= minLength;
    });
    return ` d="${kept.join('')}"`;
  });
}

export default function renderThoughtSvg({
  albedo,
  anatomy = [],
  camera,
  coverage,
  image,
  lines,
  meshes,
  options,
  palette: given = null,
  visible,
}) {
  const { height, pixelRatio, svgMonochrome, width } = options;
  const stroke = options.svgStroke ?? penPx(options) ?? 0.6;
  const palette = given ?? thoughtInks({ albedo, coverage, options });
  let outlines = meshPlotSvg({
    albedo,
    camera,
    contours: options.svgContours ?? true,
    coverage,
    creaseAngle: options.svgCreaseAngle ?? 35,
    edges: options.svgEdges ?? true,
    height,
    lines,
    meshes,
    minLength: options.svgMinLength ?? 3,
    palette,
    pixelRatio,
    silhouette: options.svgSilhouette ?? true,
    stroke,
    texture: options.svgTexture
      ? { image, levels: options.svgTextureLevels }
      : null,
    visible,
    width,
  });
  if (anatomy.length) {
    const skeleton = meshPlotSvg({
      camera,
      contours: options.svgAnatomyContours ?? true,
      creaseAngle: options.svgAnatomyCreaseAngle ?? 70,
      edges: options.svgAnatomyEdges ?? true,
      height,
      meshes: anatomy,
      minLength: options.svgAnatomyMinLength ?? 8,
      pixelRatio,
      silhouette: false,
      stroke,
      visible,
      width,
    });
    const paths = skeleton
      .slice(skeleton.indexOf('>') + 1, skeleton.lastIndexOf('</svg>'))
      .replace(/pen-(\d+)/gu, (_, pen) => `pen-${60 + Number(pen)}`)
      .replaceAll(
        '#000000',
        svgMonochrome ? '#000000' : (options.svgAnatomyInk ?? '#222222')
      );
    outlines = outlines.replace('</svg>', `${paths}</svg>`);
  }
  outlines = dropSpecks(outlines, options.svgMinLength ?? 3);
  if (options.svgShading !== 'none') {
    // In colour, paper is one more ink, never drawn: a pale surface stays
    // unshaded rather than taking whichever hue is left.
    const map = settleInks(
      inkMap({
        image: albedo,
        mask: coverage,
        palette: svgMonochrome ? palette : [...palette, paperOf(options)],
      }),
      Math.max(1, Math.round(2 * pixelRatio))
    );
    const layers = palette
      .map((ink, i) =>
        plotLayer(
          40 + i,
          `shading ${i + 1}`,
          stroke,
          shadePath({
            angle: options.svgShadeAngle,
            gamma: options.svgShadeGamma,
            height,
            image,
            mask: inkMask(map, i, coverage),
            pen: penPx(options),
            pixelRatio,
            shading: options.svgShading,
            spacing: options.svgShadeSpacing,
            width,
          }),
          ink.color
        )
      )
      .join('');
    outlines = outlines.replace('</svg>', `${layers}</svg>`);
  }
  // Lines and shading in one ink share one layer, one pen.
  const pens = new Set(
    [...outlines.matchAll(/stroke="(#[0-9a-f]{6})"/giu)].map(([, color]) =>
      color.toLowerCase()
    )
  ).size;
  return inkLayers(outlines, pens).replace(
    /<svg\b/u,
    `<svg style="background-color:${options.svgPaper ?? '#ffffff'}"`
  );
}
