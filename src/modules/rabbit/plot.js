import {
  chainKeyed,
  createProjector,
  createTone,
  meshEdges,
  nearSilhouette,
  outlineOf,
  outlineRuns,
  pathOf,
  penPx,
  plotLayer,
  sectionCuts,
  shadePath,
  silhouetteRuns,
  traceRuns,
  weldMesh,
} from '@modules/plotKit';

import furStrokes from './fur';
import grassBlades from './grass';

const AXES = { grid: [1, 2], none: [], sections: [2], slices: [1] };
const PART_CREASE = 35;

// A sheet drawn from both sides: its reversed copy turns every open edge
// into a contour, wherever it faces.
function doubled({ index, position, rest }) {
  const tris =
    index ?? Uint32Array.from({ length: position.length / 3 }, (_, i) => i);
  const both = new Uint32Array(tris.length * 2);
  both.set(tris);
  for (let t = 0; t < tris.length; t += 3) {
    both[tris.length + t] = tris[t];
    both[tris.length + t + 1] = tris[t + 2];
    both[tris.length + t + 2] = tris[t + 1];
  }
  return { index: both, position, rest };
}

function partEdges(meshes, eye, tag) {
  const segments = [];
  meshes.forEach((entry, m) => {
    const mesh = weldMesh(entry.doubleSided ? doubled(entry) : entry);
    const found = meshEdges(mesh, { creaseAngle: PART_CREASE, eye });
    [...found.contours, ...found.creases].forEach((segment) =>
      segments.push(segment.map(([key, point]) => [`${tag}${m}:${key}`, point]))
    );
  });
  return chainKeyed(segments);
}

const PIECE = 0.5;

// Faces toward the camera whose corners are mostly `key` (a per-vertex
// weight on the welded mesh: `bald`, `eye`), filled at `scale` × output
// pixels — kept where `visible` (output px and depth) says nothing nearer
// hides them.
function pieceMask(faced, key, { height, project, scale = 1, visible, width }) {
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const covered = new Uint8Array(w * h);
  faced.forEach(({ facing, mesh }) => {
    const weights = mesh[key];
    if (!weights) return;
    const { tris, world } = mesh;
    for (let t = 0; t < tris.length; t += 3) {
      const corners = [tris[t], tris[t + 1], tris[t + 2]];
      if (
        facing[t / 3] > 0 &&
        corners.reduce((sum, i) => sum + weights[i], 0) / 3 >= PIECE
      ) {
        const [a, b, c] = corners.map((i) =>
          project(world[i * 3], world[i * 3 + 1], world[i * 3 + 2])
        );
        const area = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
        if (Math.abs(area) > 1e-9) {
          const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x) * scale));
          const x1 = Math.min(
            w - 1,
            Math.ceil(Math.max(a.x, b.x, c.x) * scale)
          );
          const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y) * scale));
          const y1 = Math.min(
            h - 1,
            Math.ceil(Math.max(a.y, b.y, c.y) * scale)
          );
          for (let y = y0; y <= y1; y += 1) {
            for (let x = x0; x <= x1; x += 1) {
              const px = (x + 0.5) / scale;
              const py = (y + 0.5) / scale;
              const u =
                ((c.x - b.x) * (py - b.y) - (px - b.x) * (c.y - b.y)) / area;
              const v =
                ((a.x - c.x) * (py - c.y) - (px - c.x) * (a.y - c.y)) / area;
              if (u >= 0 && v >= 0 && u + v <= 1) {
                const depth = a.depth * u + b.depth * v + c.depth * (1 - u - v);
                if (!visible || visible(px, py, depth)) covered[y * w + x] = 1;
              }
            }
          }
        }
      }
    }
  });
  return {
    at: (x, y) => {
      const px = Math.floor(x * scale);
      const py = Math.floor(y * scale);
      return (
        px >= 0 && py >= 0 && px < w && py < h && covered[py * w + px] === 1
      );
    },
    covered,
    height: h,
    width: w,
  };
}

// Line work for the posed subject, projected through the capture camera
// and cut wherever (given `visible`) nearer surface hides it: the rabbit's
// section cuts, contours, creases and fur; the arrows, the ribbon and every
// grass blade on pens of their own; and, given the rabbit-only depth pass's
// `coverage`, his silhouette, halo and shading read from the render.
export default function renderRabbitSvg({
  arrows = true,
  camera,
  colors,
  contours = true,
  coverage = null,
  creaseAngle = 55,
  edges = true,
  eyes = null,
  fur = null,
  grass = true,
  height,
  image = null,
  lines = 24,
  outline = null,
  paper = '#ffffff',
  pixelRatio = 1,
  ribbon = true,
  shade = null,
  silhouette = false,
  stroke = 0.6,
  style = 'slices',
  subject,
  visible = null,
  width,
}) {
  const project = createProjector(camera, width, height);
  const onOutline =
    silhouette && coverage ? nearSilhouette(coverage, pixelRatio) : null;
  const hiddenBy = (edgeLike) => (p) =>
    (visible && !visible(p.x, p.y, p.depth)) ||
    (edgeLike && onOutline && onOutline(p.x, p.y));
  const trace = (polylines, edgeLike, minLength = 0) =>
    traceRuns(polylines, {
      height,
      hidden: hiddenBy(edgeLike),
      minLength,
      project,
      width,
    });

  const { rabbit } = subject;
  const welded = rabbit.meshes.map((entry) => {
    const mesh = weldMesh(entry);
    ['bald', 'eye'].forEach((key) => {
      if (!entry[key]) return;
      mesh[key] = new Float32Array(mesh.count);
      entry[key].forEach((weight, i) => {
        const id = mesh.remap[i];
        mesh[key][id] = Math.max(mesh[key][id], weight);
      });
    });
    return mesh;
  });
  const contourSegments = [];
  const creaseSegments = [];
  const faced = welded.map((mesh, m) => {
    const found = meshEdges(mesh, { creaseAngle, eye: camera.eye });
    const tag = (segment) =>
      segment.map(([key, point]) => [`${m}:${key}`, point]);
    if (contours) contourSegments.push(...found.contours.map(tag));
    if (edges) creaseSegments.push(...found.creases.map(tag));
    return { facing: found.facing, mesh };
  });

  const sliceRuns = [];
  AXES[style]?.forEach((axis) => {
    sliceRuns.push(
      ...trace(
        chainKeyed(
          sectionCuts(faced, { axis, count: lines, inverse: rabbit.inverse })
        ),
        false,
        2
      )
    );
  });
  const contourRuns = trace(chainKeyed(contourSegments), true, 4);
  const creaseRuns = trace(chainKeyed(creaseSegments), true, 4);

  let furRuns = [];
  if (fur) {
    const tone =
      fur.shade > 0 && image && coverage
        ? createTone({ gamma: 1, image, mask: coverage, pixelRatio })
        : null;
    const keep = tone
      ? (point, r) => {
          const p = project(...point);
          return r < 1 - fur.shade + fur.shade * tone(p.x, p.y);
        }
      : null;
    const strokes = faced.flatMap(({ facing, mesh }) =>
      furStrokes(mesh, {
        density: fur.density,
        facing,
        keep,
        length: fur.length,
      })
    );
    const onBald = pieceMask(faced, 'bald', { height, project, width }).at;
    furRuns = traceRuns(strokes, {
      height,
      hidden: (p) => hiddenBy(false)(p) || onBald(p.x, p.y),
      minLength: 1,
      project,
      width,
    });
  }

  const eyeShading =
    eyes && image
      ? shadePath({
          ...eyes,
          equalize: false,
          gamma: 1,
          height,
          image,
          mask: pieceMask(faced, 'eye', {
            height,
            project,
            scale: pixelRatio,
            visible,
            width,
          }),
          pen: eyes.pen ?? stroke,
          pixelRatio,
          width,
        })
      : '';

  const arrowRuns =
    arrows && subject.arrows?.length
      ? trace(partEdges(subject.arrows, camera.eye, 'a'), false, 2)
      : [];
  const ribbonRuns =
    ribbon && subject.ribbon?.length
      ? trace(partEdges(subject.ribbon, camera.eye, 'r'), false, 2)
      : [];
  const grassRuns =
    grass && subject.grass ? trace(grassBlades(subject.grass), false, 1) : [];

  const outlineLoops =
    silhouette && coverage ? silhouetteRuns(coverage, pixelRatio) : [];
  const halo =
    outline && coverage ? outlineRuns({ coverage, outline, pixelRatio }) : [];
  const shading = shade
    ? shadePath({
        ...shade,
        height,
        image,
        mask: coverage,
        pen: shade.pen ?? stroke,
        pixelRatio,
        width,
      })
    : '';

  const layer = (pen, label, runs, ink) =>
    runs.length ? plotLayer(pen, label, stroke, pathOf(runs), ink) : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color:${paper}">` +
    `${layer(0, 'slices', sliceRuns, colors.ink)}` +
    `${layer(1, 'silhouette', outlineLoops, colors.ink)}` +
    `${shading ? plotLayer(2, 'shading', stroke, shading, colors.ink) : ''}` +
    `${layer(3, 'contours', contourRuns, colors.ink)}` +
    `${layer(4, 'outline', halo, colors.ink)}` +
    `${layer(5, 'creases', creaseRuns, colors.ink)}` +
    `${layer(6, 'fur', furRuns, colors.fur)}` +
    `${layer(7, 'arrows', arrowRuns, colors.arrows)}` +
    `${layer(8, 'ribbon', ribbonRuns, colors.ribbon)}` +
    `${layer(9, 'grass', grassRuns, colors.grass)}` +
    `${eyeShading ? plotLayer(10, 'eyes', stroke, eyeShading, colors.eye) : ''}</svg>`
  );
}

const mixHex = (a, b, t) => {
  const channel = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
};

// Each pen in the colour it is drawn in, so `svgColors` regroups by it.
export function plotColors(config) {
  return {
    arrows: '#3e3a37',
    eye: '#121010',
    fur: mixHex(config.outlineColor, '#c2bdb6', 0.35),
    grass: mixHex(config.grassRootColor, config.grassTipColor, 0.4),
    ink: config.outlineColor,
    ribbon: '#cf5661',
  };
}

// The render options a plot reads, as renderRabbitSvg's arguments; a
// caller adds the camera, the subject, the image and depth it captured.
export function plotArgs(options, config) {
  return {
    arrows: options.svgArrows,
    colors: plotColors(config),
    contours: options.svgContours,
    creaseAngle: options.svgCreaseAngle,
    edges: options.svgEdges,
    eyes:
      options.svgEyes && options.svgEyes !== 'none'
        ? {
            angle: options.svgShadeAngle,
            pen: penPx(options),
            shading: options.svgEyes,
            spacing: options.svgEyeSpacing,
          }
        : null,
    fur: options.svgFur
      ? {
          density: options.svgFurDensity,
          length: options.svgFurLength / 1000,
          shade: options.svgFurShade,
        }
      : null,
    grass: options.svgGrass,
    height: options.height,
    lines: options.svgLines,
    outline: outlineOf(options, null),
    paper: options.svgPaper,
    pixelRatio: options.pixelRatio,
    ribbon: options.svgRibbon,
    shade:
      options.svgShading && options.svgShading !== 'none'
        ? {
            angle: options.svgShadeAngle,
            gamma: options.svgShadeGamma,
            pen: penPx(options),
            shading: options.svgShading,
            spacing: options.svgShadeSpacing,
          }
        : null,
    silhouette: options.svgSilhouette,
    stroke: options.svgStroke,
    style: options.svgStyle,
    width: options.width,
  };
}

const shaded = (options) =>
  Boolean(options.svgShading && options.svgShading !== 'none');
const toned = (options) =>
  shaded(options) || (options.svgFur && options.svgFurShade > 0);
const eyed = (options) =>
  Boolean(options.svgEyes && options.svgEyes !== 'none');

// Whether a plot needs the rabbit-only depth pass (silhouette, halo,
// shading and the fur's tone are his alone).
export const needsCoverage = (options) =>
  Boolean(
    options.svgSilhouette ||
    toned(options) ||
    (options.svgOutline && options.svgOutline !== 'none')
  );

// Whether a plot needs the whole subject's depth pass, for hidden lines.
export const needsDepth = (options) => Boolean(options.svgOcclusion);

// Whether a plot reads the render itself.
export const needsImage = (options) => toned(options) || eyed(options);
