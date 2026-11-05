import {
  chain,
  distance2,
  erodeMask,
  imagePalette,
  inkLayers,
  inkMap,
  inkMask,
  isoSegments,
  lab,
  meshPlotSvg,
  penPx,
  plotLayer,
  shadePath,
  silhouetteRuns,
  simplifyLoop,
  smooth,
  stretchTone,
} from '@modules/plotKit';

import {
  clipStrokePath,
  lineClearance,
  pathRuns,
  selectFeatures,
  structureRuns,
  thinPlot,
} from './plotFeatures';
import renderInkStudy from './plotInkStudy';

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
      if (/[ACHQSTV]/iu.test(part)) return true;
      const n = (part.match(/-?\d+(?:\.\d+)?/gu) ?? []).map(Number);
      let length = 0;
      for (let i = 2; i + 1 < n.length; i += 2)
        length += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]);
      return length >= minLength;
    });
    return ` d="${kept.join('')}"`;
  });
}

function softenedTone(image, radius) {
  const { data, height, width } = image;
  let values = new Float32Array(width * height);
  for (let i = 0; i < values.length; i += 1)
    values[i] =
      0.2126 * data[i * 4] +
      0.7152 * data[i * 4 + 1] +
      0.0722 * data[i * 4 + 2];
  [true, false].forEach((horizontal) => {
    const blurred = new Float32Array(values.length);
    const length = horizontal ? width : height;
    const rows = horizontal ? height : width;
    const at = (row, k) => (horizontal ? row * width + k : k * width + row);
    for (let row = 0; row < rows; row += 1) {
      let sum = 0;
      for (let k = -radius; k < length; k += 1) {
        if (k + radius < length) sum += values[at(row, k + radius)];
        if (k - radius - 1 >= 0) sum -= values[at(row, k - radius - 1)];
        if (k >= 0)
          blurred[at(row, k)] =
            sum /
            (Math.min(length - 1, k + radius) - Math.max(0, k - radius) + 1);
      }
    }
    values = blurred;
  });
  const softened = new Uint8ClampedArray(data.length);
  values.forEach((value, i) => {
    softened.fill(value, i * 4, i * 4 + 3);
    softened[i * 4 + 3] = 255;
  });
  return { data: softened, height, width };
}

function formRuns(image, region, level, pixelRatio, pen) {
  if (!image) return [];
  const { height, width } = image;
  const at = (u, v) =>
    Math.min(height - 1, Math.floor(v * height)) * width +
    Math.min(width - 1, Math.floor(u * width));
  const segments = isoSegments(
    (u, v) => image.data[at(u, v) * 4] / 255,
    Math.max(
      16,
      Math.ceil(Math.max(width, height) / Math.max(1, pen * pixelRatio * 0.5))
    ),
    level,
    (u, v) => region.covered[at(u, v)]
  );
  return chain(segments).map((run) =>
    smooth(
      simplifyLoop(
        run.map(([x, y]) => [x * width, y * height]),
        pen * pixelRatio * 0.5
      )
    ).map(([x, y]) => ({ x: x / pixelRatio, y: y / pixelRatio }))
  );
}

export default function renderThoughtSvg({
  albedo,
  anatomy = [],
  anatomyMask = null,
  anatomyImage = null,
  skullMask = null,
  femurMask = null,
  camera,
  censor = null,
  censorGrid = null,
  cloud = null,
  cloudImage = null,
  cloudPuffs = [],
  coverage,
  image,
  lines,
  meshes,
  normals = null,
  options,
  palette: given = null,
  visible,
}) {
  const { height, pixelRatio, svgMonochrome, width } = options;
  const stroke = options.svgStroke ?? penPx(options) ?? 0.6;
  const pen = penPx(options) ?? stroke;
  const palette = given ?? thoughtInks({ albedo, coverage, options });
  if (options.svgDrawing === 'ink')
    return renderInkStudy({
      albedo,
      anatomyMask,
      skullMask,
      femurMask,
      anatomyImage: anatomyImage ?? image,
      cloud,
      cloudImage,
      cloudPuffs,
      censor,
      censorGrid,
      coverage,
      options,
      palette,
    });
  const structural = (options.svgAnatomyDetail ?? 'structure') === 'structure';
  const boneRims =
    anatomyMask && options.svgSilhouette !== false
      ? silhouetteRuns(anatomyMask, pixelRatio, pen * pixelRatio * 0.35)
      : [];
  const features =
    structural && anatomyMask
      ? selectFeatures(
          structureRuns({
            camera,
            coverage,
            mask: anatomyMask,
            normals,
            pen,
            pixelRatio,
            sensitivity: options.svgStructureSensitivity ?? 0.55,
          }),
          boneRims,
          pen,
          ((options.svgFeatureMinMm ?? 0.6) * width) /
            (options.plotWidthMm || (width * 25.4) / 96)
        )
      : [];
  const haloMask = minus(coverage, cloud, anatomyMask);
  const haloRims =
    options.svgSilhouette !== false
      ? silhouetteRuns(haloMask, pixelRatio, pen * pixelRatio * 0.35)
      : [];
  let outlines = meshPlotSvg({
    albedo,
    camera,
    contours: options.svgContours ?? true,
    coverage: haloMask,
    creaseAngle: options.svgCreaseAngle ?? 35,
    edges: options.svgEdges ?? true,
    height,
    lines,
    meshes,
    minLength: options.svgMinLength ?? 3,
    palette,
    pixelRatio,
    silhouette: false,
    stroke,
    texture: null,
    visible,
    width,
  });
  outlines = thinPlot(
    outlines,
    haloRims,
    pen,
    Math.max(pen, options.svgMinLength ?? 3)
  );
  const haloMarks = [
    ...haloRims,
    ...[...outlines.matchAll(/ d="([^"]*)"/gu)].flatMap(([, d]) => pathRuns(d)),
  ];
  if (options.svgTexture) {
    const textureSvg = meshPlotSvg({
      albedo,
      camera,
      coverage: haloMask,
      contours: false,
      edges: false,
      height,
      meshes: [],
      palette,
      pixelRatio,
      silhouette: false,
      stroke,
      texture: { image, levels: options.svgTextureLevels },
      width,
    });
    const clean = thinPlot(textureSvg, haloMarks, pen, pen * 2);
    const paths = clean
      .slice(clean.indexOf('>') + 1, clean.lastIndexOf('</svg>'))
      .replace(/pen-(\d+)/gu, (_, index) => `pen-${100 + Number(index)}`);
    haloMarks.push(
      ...[...clean.matchAll(/ d="([^"]*)"/gu)].flatMap(([, d]) => pathRuns(d))
    );
    outlines = outlines.replace('</svg>', `${paths}</svg>`);
  }
  if (haloRims.length)
    outlines = outlines.replace(
      '</svg>',
      `${plotLayer(76, 'halo silhouette', stroke, pathOfRuns(haloRims), palette[0].color)}</svg>`
    );
  // The bone outline shares the nearest plot ink rather than taking a pen
  // of its own out of a small `svgColors` budget.
  const wanted = options.svgAnatomyInk ?? '#222222';
  const target = lab(...rgbOf(wanted));
  const anatomyInk = options.svgColors
    ? palette.reduce((a, b) =>
        distance2(b.lab, target) < distance2(a.lab, target) ? b : a
      ).color
    : wanted;
  if (anatomy.length || anatomyMask) {
    const skeleton = meshPlotSvg({
      camera,
      contours:
        !structural &&
        options.svgAnatomyDetail !== 'none' &&
        (options.svgAnatomyContours ?? true),
      contourTolerance: pen * 0.5,
      coverage: anatomyMask,
      creaseAngle: options.svgAnatomyCreaseAngle ?? 70,
      edges:
        !structural &&
        options.svgAnatomyDetail !== 'none' &&
        (options.svgAnatomyEdges ?? false),
      height,
      meshes: structural || options.svgAnatomyDetail === 'none' ? [] : anatomy,
      minLength: Math.max(options.svgAnatomyMinLength ?? 8, pen * 4),
      pixelRatio,
      silhouette: options.svgSilhouette ?? true,
      outlineTolerance: pen * 0.5,
      stroke,
      visible,
      width,
    });
    const paths = skeleton
      .slice(skeleton.indexOf('>') + 1, skeleton.lastIndexOf('</svg>'))
      .replace(/pen-(\d+)/gu, (_, index) => `pen-${60 + Number(index)}`)
      .replaceAll('#000000', svgMonochrome ? '#000000' : anatomyInk);
    outlines = outlines.replace('</svg>', `${paths}</svg>`);
  }
  const perMm = width / (options.plotWidthMm || (width * 25.4) / 96);
  const spacing = Math.max(
    options.svgShadeSpacing ?? 6,
    (options.svgShadeSpacingMm ?? 1.1) * perMm,
    pen * 2.5
  );
  const raw = inkMap({ image: albedo, mask: coverage, palette });
  const map = settleInks(raw, Math.max(1, Math.round(2 * pixelRatio)));
  const extra = [];
  const outlineInk = svgMonochrome ? '#000000' : anatomyInk;
  if (cloud && options.svgSilhouette !== false) {
    const runs = silhouetteRuns(cloud, pixelRatio, pen * pixelRatio * 0.6);
    extra.push(plotLayer(70, 'cloud', stroke, pathOfRuns(runs), outlineInk));
  }
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
  {
    const shade = (region, tone, angle, gap, style, obstacles = []) => {
      if (!tone || style === 'none') return '';
      const factors = {
        scribble: 5,
        squiggle: 4,
        stipple: 5,
        halftone: 4,
        tsp: 4,
      };
      const separated = Math.max(gap, pen * (factors[style] ?? 2.5));
      let footprint = pen * 0.5;
      if (style === 'halftone') footprint += separated * 0.5;
      if (style === 'stipple')
        footprint += Math.max(pen * 0.5, separated * 0.12);
      const within = lineClearance(
        erodeMask(region, Math.ceil(footprint * pixelRatio)),
        obstacles,
        Math.max(pen * 1.25, footprint + pen * 0.75),
        pixelRatio
      );
      const path = shadePath({
        angle,
        equalize: false,
        gamma: options.svgShadeGamma,
        height,
        image: tone,
        mask: within,
        pen,
        pixelRatio,
        shading: style === 'hatch' ? 'crosshatch' : style,
        spacing: separated,
        width,
      });
      return clipStrokePath(path, within, pixelRatio, pen);
    };
    // Thin parts (orbit tubes, ring rims) are left to their outlines.
    const body = erodeMask(
      minus(coverage, cloud, censor, anatomyMask),
      Math.round((spacing / 2) * pixelRatio)
    );
    if (anatomyMask) {
      const bone = erodeMask(anatomyMask, Math.ceil(pen * pixelRatio));
      const tone = softenedTone(
        image,
        Math.max(1, Math.round(pen * pixelRatio))
      );
      const stretched = stretchTone({
        floor:
          (options.svgAnatomyShading ?? 'hatch') === 'crosshatch' ? 0.52 : 0.65,
        image: tone,
        minSpan: 0.25,
        region: bone,
      });
      extra.push(
        plotLayer(
          71,
          'bone shading',
          stroke,
          shade(
            bone,
            stretched,
            options.svgShadeAngle,
            Math.max(spacing * 1.1, pen * 3),
            options.svgAnatomyShading ?? 'hatch',
            [...boneRims, ...features]
          ),
          outlineInk
        )
      );
    }
    if (cloud) {
      const source = cloudImage ?? image;
      const opacity = {
        ...source,
        data: new Uint8ClampedArray(source.data.length),
      };
      cloud.covered.forEach((on, i) => {
        const value = on ? 255 - source.data[i * 4 + 3] : 255;
        opacity.data.fill(value, i * 4, i * 4 + 3);
        opacity.data[i * 4 + 3] = 255;
      });
      const tone = stretchTone({
        floor: 0.65,
        image: softenedTone(opacity, Math.max(1, Math.round(pen * pixelRatio))),
        minSpan: 0.2,
        region: cloud,
      });
      const interior = erodeMask(cloud, Math.ceil(pen * pixelRatio * 0.5));
      const cloudRims = silhouetteRuns(
        cloud,
        pixelRatio,
        pen * pixelRatio * 0.6
      );
      const puffs = selectFeatures(
        [0.76, 0.87].flatMap((level) =>
          formRuns(tone, interior, level, pixelRatio, pen)
        ),
        cloudRims,
        pen,
        pen * 3
      );
      extra.push(
        plotLayer(74, 'cloud puffs', stroke, pathOfRuns(puffs), outlineInk)
      );
      extra.push(
        plotLayer(
          72,
          'cloud shading',
          stroke,
          shade(
            erodeMask(cloud, Math.ceil(pen * pixelRatio)),
            tone,
            options.svgShadeAngle,
            Math.max(spacing * 1.4, pen * 4),
            options.svgCloudShading ?? 'stipple',
            puffs
          ),
          outlineInk
        )
      );
    }
    const blockTone = censor
      ? { ...image, data: new Uint8ClampedArray(image.data.length).fill(175) }
      : null;
    palette.forEach((ink, i) => {
      const solid = inkMask(map, i, body);
      const blocks = censor ? inkMask(raw, i, censor) : null;
      const d = [
        shade(
          solid,
          stretchTone({ image, keep: 0.35, region: solid }),
          options.svgShadeAngle,
          spacing,
          options.svgShading,
          haloMarks
        ),
        blocks &&
          shade(
            blocks,
            blockTone,
            0,
            Math.max(pen * 2.5, spacing * 0.7),
            options.svgCensorShading ?? 'hatch'
          ),
      ].join('');
      if (d)
        extra.push(plotLayer(40 + i, `shading ${i + 1}`, stroke, d, ink.color));
    });
  }
  outlines = dropSpecks(
    outlines.replace('</svg>', `${extra.join('')}</svg>`),
    Math.max(options.svgMinLength ?? 3, pen * 2)
  );
  if (features.length)
    outlines = outlines.replace(
      '</svg>',
      `${plotLayer(75, 'bone structure', stroke, pathOfRuns(features), outlineInk)}</svg>`
    );
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
