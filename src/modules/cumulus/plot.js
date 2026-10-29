import {
  distance2,
  erodeMask,
  imagePalette,
  inkLayers,
  inkMap,
  inkMask,
  lab,
  meshPlotSvg,
  penPx,
  plotLayer,
  shadePath,
  stretchTone,
} from '@modules/plotKit';

const BLACK = { color: '#000000', lab: lab(0, 0, 0) };
const rgbOf = (color) =>
  [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));

const paperOf = (options) => {
  const rgb = rgbOf(options.svgPaper ?? '#ffffff');
  return { color: options.svgPaper ?? '#ffffff', lab: lab(...rgb) };
};

const hexOf = (rgb) =>
  `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

// An ink too close to the paper, darkened until it reads on it: pale bone
// keeps a bone-coloured pen instead of vanishing into the page.
function readable(ink, paper, distance) {
  const rgb = rgbOf(ink.color);
  let scale = 1;
  let at = ink.lab;
  const scaled = (k) => rgb.map((v) => v * k);
  while (scale > 0.05 && distance2(at, paper) < distance ** 2) {
    scale -= 0.02;
    at = lab(...scaled(scale));
  }
  return scale === 1 ? ink : { ...ink, color: hexOf(scaled(scale)), lab: at };
}

// One palette for the lines and the shading, every ink legible on the paper.
export function thoughtInks({ albedo, coverage, options }) {
  if (options.svgMonochrome) return [BLACK];
  const paper = paperOf(options).lab;
  const sampled = imagePalette({
    image: albedo,
    k: options.svgColors || 8,
    mask: coverage,
    vivid: 1,
  });
  const kept = sampled.filter((ink) => ink.mass >= 0.01);
  return (kept.length ? kept : sampled.slice(0, 1)).map((ink) =>
    readable(ink, paper, options.svgPaperDistance ?? 0)
  );
}

const minus = (mask, ...cuts) => ({
  ...mask,
  covered: mask.covered.map(
    (on, i) => on && !cuts.some((cut) => cut?.covered[i])
  ),
});

// The censor's blocks as the pen should draw them: every boundary between
// two inks inside it, axis-aligned in the block grid, in the darker ink.
function blockEdges(map, censor, palette, pixelRatio) {
  const { height, ink, width } = map;
  const inside = (x, y) => censor.covered[y * width + x];
  const darker = (a, b) => (palette[a].lab[0] <= palette[b].lab[0] ? a : b);
  const runs = palette.map(() => []);
  const scan = (outer, inner, across) => {
    for (let o = 0; o < outer; o += 1) {
      let open = null;
      const close = (end) => {
        if (open && end - open.from >= 2 * pixelRatio) {
          const [a, b] = [open.from, end].map((t) =>
            across ? [o + 1, t] : [t, o + 1]
          );
          runs[open.ink].push([
            { x: a[0] / pixelRatio, y: a[1] / pixelRatio },
            { x: b[0] / pixelRatio, y: b[1] / pixelRatio },
          ]);
        }
        open = null;
      };
      for (let t = 0; t < inner; t += 1) {
        const [x0, y0, x1, y1] = across ? [o, t, o + 1, t] : [t, o, t, o + 1];
        const i0 = y0 * width + x0;
        const i1 = y1 * width + x1;
        const edge =
          inside(x0, y0) && inside(x1, y1) && ink[i0] !== ink[i1]
            ? darker(ink[i0], ink[i1])
            : -1;
        if (open && open.ink !== edge) close(t);
        if (edge >= 0 && !open) open = { from: t, ink: edge };
      }
      close(inner);
    }
  };
  scan(width - 1, height, true);
  scan(height - 1, width, false);
  return runs;
}

const pathOfRuns = (runs) =>
  runs
    .map(
      (run) =>
        `M${run.map(({ x, y }) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}`
    )
    .join('');

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
  censor = null,
  cloud = null,
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
  // The bone outline shares the nearest plot ink rather than taking a pen
  // of its own out of a small `svgColors` budget.
  const wanted = options.svgAnatomyInk ?? '#222222';
  const target = lab(...rgbOf(wanted));
  const anatomyInk = options.svgColors
    ? palette.reduce((a, b) =>
        distance2(b.lab, target) < distance2(a.lab, target) ? b : a
      ).color
    : wanted;
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
      .replaceAll('#000000', svgMonochrome ? '#000000' : anatomyInk);
    outlines = outlines.replace('</svg>', `${paths}</svg>`);
  }
  outlines = dropSpecks(outlines, options.svgMinLength ?? 3);
  const pen = penPx(options) ?? stroke;
  const spacing = Math.max(options.svgShadeSpacing ?? 6, pen * 2);
  const raw = inkMap({ image: albedo, mask: coverage, palette });
  const map = settleInks(raw, Math.max(1, Math.round(2 * pixelRatio)));
  const extra = [];
  if (censor) {
    blockEdges(raw, censor, palette, pixelRatio).forEach((runs, i) => {
      if (runs.length)
        extra.push(
          plotLayer(
            30 + i,
            `censor ${i + 1}`,
            stroke,
            pathOfRuns(runs),
            palette[i].color
          )
        );
    });
  }
  if (options.svgShading !== 'none') {
    const shade = (region, tone, angle, gap) =>
      tone
        ? shadePath({
            angle,
            gamma: options.svgShadeGamma,
            height,
            image: tone,
            mask: region,
            pen,
            pixelRatio,
            shading: options.svgShading,
            spacing: gap,
            width,
          })
        : '';
    // Thin parts (orbit tubes, ring rims) are left to their outlines.
    const body = minus(
      erodeMask(
        minus(coverage, cloud, censor),
        Math.round((spacing / 2) * pixelRatio)
      ),
      cloud,
      censor
    );
    palette.forEach((ink, i) => {
      const solid = inkMask(map, i, body);
      const haze = cloud ? inkMask(map, i, cloud) : null;
      const blocks = censor ? inkMask(raw, i, censor) : null;
      const d = [
        shade(
          solid,
          stretchTone({ image, keep: 0.35, region: solid }),
          options.svgShadeAngle,
          spacing
        ),
        haze &&
          shade(
            haze,
            stretchTone({ floor: 0.72, image, region: haze }),
            options.svgShadeAngle,
            spacing * 1.5
          ),
        blocks &&
          shade(
            blocks,
            stretchTone({ image, keep: 1, region: blocks }),
            0,
            spacing
          ),
      ].join('');
      if (d)
        extra.push(plotLayer(40 + i, `shading ${i + 1}`, stroke, d, ink.color));
    });
  }
  outlines = outlines.replace('</svg>', `${extra.join('')}</svg>`);
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
