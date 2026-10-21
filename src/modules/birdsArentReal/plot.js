import {
  colorRuns,
  createProjector,
  createTone,
  imagePalette,
  nearSilhouette,
  outlineOf,
  outlineRuns,
  pathOf,
  penPx,
  plotLayer,
  shadePath,
  silhouetteRuns,
  simplifyLoop,
  textureRuns,
  wiggleRuns,
} from '@modules/plotKit';

import { chainKeyed, meshEdges, sectionCuts, weldMesh } from './mesh';

const SAMPLE_PX = 1.5;

const strokeLength = (run) =>
  run.reduce(
    (sum, p, i) =>
      i ? sum + Math.hypot(p.x - run[i - 1].x, p.y - run[i - 1].y) : 0,
    0
  );

// Polylines of world points → screen runs, sampled about every 1.5 px and
// cut wherever a sample leaves the frame, is hidden (`visible`) or, for
// edge-like strokes, sits on the silhouette the outline layer draws.
function traceRuns(lines, { height, hidden, minLength, project, width }) {
  const runs = [];
  lines.forEach((line) => {
    let run = [];
    const flush = () => {
      if (run.length > 1) {
        const simple = simplifyLoop(
          run.map((p) => [p.x, p.y]),
          0.2
        ).map(([x, y]) => ({ x, y }));
        if (strokeLength(simple) >= minLength) runs.push(simple);
      }
      run = [];
    };
    const visit = (point) => {
      const p = project(...point);
      const shown =
        p.depth > 0 &&
        p.x >= -1 &&
        p.y >= -1 &&
        p.x <= width + 1 &&
        p.y <= height + 1 &&
        !hidden(p);
      if (shown) run.push(p);
      else flush();
    };
    for (let i = 0; i < line.length - 1; i += 1) {
      const a = line[i];
      const b = line[i + 1];
      const pa = project(...a);
      const pb = project(...b);
      const steps = Math.max(
        1,
        Math.ceil(Math.hypot(pb.x - pa.x, pb.y - pa.y) / SAMPLE_PX)
      );
      for (let s = i === 0 ? 0 : 1; s <= steps; s += 1) {
        const t = s / steps;
        visit([
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          a[2] + (b[2] - a[2]) * t,
        ]);
      }
    }
    flush();
  });
  return runs;
}

const AXES = { grid: [1, 2], none: [], sections: [2], slices: [1] };

// Line work for a posed flock: section cuts across each bird in its own
// frame, its occluding contours and creases, projected through the capture
// camera and cut wherever (given `visible`) nearer surface hides them; and,
// given the depth pass's `coverage`, the silhouette, the Outline-style
// halo, the shading and the texture contours read from the render.
export default function renderFlockSvg({
  camera,
  color = null,
  contours = true,
  coverage = null,
  creaseAngle = 35,
  edges = true,
  flock,
  height,
  image = null,
  lines = 18,
  outline = null,
  paper = '#ffffff',
  pixelRatio = 1,
  shade = null,
  silhouette = false,
  stroke = 0.6,
  style = 'slices',
  texture = null,
  visible = null,
  width,
  wiggle = null,
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

  const welded = flock.meshes.map((entry) => ({
    bird: entry.bird,
    mesh: weldMesh(entry),
  }));
  const contourSegments = [];
  const creaseSegments = [];
  const faced = welded.map(({ bird, mesh }, m) => {
    const found = meshEdges(mesh, { creaseAngle, eye: camera.eye });
    const tag = (segment) =>
      segment.map(([key, point]) => [`${m}:${key}`, point]);
    if (contours) contourSegments.push(...found.contours.map(tag));
    if (edges) creaseSegments.push(...found.creases.map(tag));
    return { bird, facing: found.facing, mesh };
  });

  const sliceRuns = [];
  AXES[style]?.forEach((axis) => {
    flock.birds.forEach((bird, b) => {
      const mine = faced.filter((entry) => entry.bird === b);
      if (!mine.length) return;
      sliceRuns.push(
        ...trace(
          chainKeyed(
            sectionCuts(mine, { axis, count: lines, inverse: bird.inverse })
          ),
          false,
          2
        )
      );
    });
  });

  // Tone as wiggle on the sections, then the sections split into the
  // render's own inks: a layer per colour, the outline layers left black.
  const toned =
    wiggle && image && coverage
      ? wiggleRuns(sliceRuns, {
          amplitude: wiggle.amplitude,
          tone: createTone({ gamma: 1, image, mask: coverage, pixelRatio }),
          wavelength: (t) =>
            Math.max(wiggle.amplitude * 4 * (1.6 - t), wiggle.minWave),
        })
      : sliceRuns;
  const palette =
    color && image && coverage
      ? imagePalette({ image, k: color.inks, mask: coverage })
      : [];
  const inkRuns = palette.length
    ? colorRuns(toned, { image, mask: coverage, palette, pixelRatio })
    : null;
  const sectionLayers = inkRuns
    ? palette
        .filter((entry) => inkRuns[entry.color]?.length)
        .map((entry, i) =>
          plotLayer(
            10 + i,
            `sections ${i + 1}`,
            stroke,
            pathOf(inkRuns[entry.color]),
            entry.color
          )
        )
        .join('')
    : '';

  const contourRuns = trace(chainKeyed(contourSegments), true, 4);
  const creaseRuns = trace(chainKeyed(creaseSegments), true, 4);

  const outlineLoops =
    silhouette && coverage ? silhouetteRuns(coverage, pixelRatio) : [];
  const halo =
    outline && coverage ? outlineRuns({ coverage, outline, pixelRatio }) : [];
  const textureLines =
    texture && coverage && image
      ? textureRuns({ coverage, image, levels: texture.levels, pixelRatio })
      : [];
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

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color:${paper}">` +
    `${!inkRuns && toned.length ? plotLayer(0, 'sections', stroke, pathOf(toned)) : ''}` +
    `${sectionLayers}` +
    `${outlineLoops.length ? plotLayer(1, 'silhouette', stroke, pathOf(outlineLoops)) : ''}` +
    `${shading ? plotLayer(2, 'shading', stroke, shading) : ''}` +
    `${contourRuns.length ? plotLayer(3, 'contours', stroke, pathOf(contourRuns)) : ''}` +
    `${halo.length ? plotLayer(4, 'outline', stroke, pathOf(halo)) : ''}` +
    `${creaseRuns.length ? plotLayer(5, 'creases', stroke, pathOf(creaseRuns)) : ''}` +
    `${textureLines.length ? plotLayer(6, 'texture', stroke, pathOf(textureLines)) : ''}</svg>`
  );
}

// The render options a plot reads, as renderFlockSvg's arguments; a caller
// adds the camera, flock mesh, image and depth it captured.
const pxPerMm = ({ plotWidthMm, width }) =>
  plotWidthMm ? width / plotWidthMm : 96 / 25.4;

export function plotArgs(options) {
  return {
    color: options.svgColors > 0 ? { inks: options.svgColors } : null,
    contours: options.svgContours,
    creaseAngle: options.svgCreaseAngle,
    edges: options.svgEdges,
    height: options.height,
    lines: options.svgLines,
    outline: outlineOf(options, null),
    paper: options.svgPaper,
    pixelRatio: options.pixelRatio,
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
    texture: options.svgTexture ? { levels: options.svgTextureLevels } : null,
    width: options.width,
    wiggle:
      options.svgWiggle > 0
        ? {
            amplitude: options.svgWiggle * pxPerMm(options),
            minWave: 4 * (options.svgPenMm || 0.3) * pxPerMm(options),
          }
        : null,
  };
}

const colouring = (options) => options.svgColors > 0 || options.svgWiggle > 0;

// Whether a plot needs the birds-only depth pass.
export const needsDepth = (options) =>
  Boolean(
    colouring(options) ||
    options.svgOcclusion ||
    options.svgSilhouette ||
    options.svgTexture ||
    (options.svgOutline && options.svgOutline !== 'none') ||
    (options.svgShading && options.svgShading !== 'none')
  );

// Whether a plot reads the render itself (shading, texture contours).
export const needsImage = (options) =>
  Boolean(
    colouring(options) ||
    options.svgTexture ||
    (options.svgShading && options.svgShading !== 'none')
  );
