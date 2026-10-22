import { createRng } from '@modules/flora';
import {
  chainKeyed,
  colorRuns,
  createProjector,
  dotPath,
  imagePalette,
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
  textureRuns,
  traceRuns,
  weldMesh,
} from '@modules/plotKit';

const AXES = { grid: [1, 2], none: [], sections: [2], slices: [1] };
const DEG = Math.PI / 180;

// Each flame blob as the sphere it roughly is: the centroid of its
// displaced vertices and their mean distance from it.
function blobSphere({ meshes }) {
  const { position } = meshes[0];
  const n = position.length / 3;
  const c = [0, 0, 0];
  for (let i = 0; i < n; i += 1) {
    c[0] += position[i * 3] / n;
    c[1] += position[i * 3 + 1] / n;
    c[2] += position[i * 3 + 2] / n;
  }
  let r = 0;
  for (let i = 0; i < n; i += 1) {
    r +=
      Math.hypot(
        position[i * 3] - c[0],
        position[i * 3 + 1] - c[1],
        position[i * 3 + 2] - c[2]
      ) / n;
  }
  return { center: c, radius: r };
}

// Whether a projected point lies inside a nearer flame blob's disc and
// behind that blob's middle — the blobs are drawn without depth, so they
// hide each other (and the smoke behind them) this way.
function blobCover(blobs, { camera, height, project }) {
  const focal = height / 2 / Math.tan((camera.fov * DEG) / 2);
  const discs = blobs
    .map(({ center, radius }) => {
      const p = project(...center);
      return { depth: p.depth, r: (radius * focal) / p.depth, x: p.x, y: p.y };
    })
    .filter((disc) => disc.depth > 0);
  return (p) =>
    discs.some(
      (disc) =>
        p.depth > disc.depth &&
        Math.hypot(p.x - disc.x, p.y - disc.y) < disc.r * 0.92
    );
}
const round = (value) => Math.round(value * 100) / 100;

// Smoke as the render shows it: where the render with smoke differs from
// the one without, and how strongly, as a grey image (darker = more smoke)
// and its mask, so the shading reads the same on a white street or a dark
// one.
export function smokeContrast(withSmoke, without, threshold = 0.03) {
  const { height, width } = withSmoke;
  const covered = new Uint8Array(width * height);
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    const d =
      Math.max(
        Math.abs(withSmoke.data[o] - without.data[o]),
        Math.abs(withSmoke.data[o + 1] - without.data[o + 1]),
        Math.abs(withSmoke.data[o + 2] - without.data[o + 2])
      ) / 255;
    covered[i] = d > threshold ? 1 : 0;
    const grey = Math.round(255 * (1 - Math.min(1, d * 2)));
    data[o] = grey;
    data[o + 1] = grey;
    data[o + 2] = grey;
    data[o + 3] = 255;
  }
  return { image: { data, height, width }, mask: { covered, height, width } };
}

// Strokes for one group of read-back objects: each object's section cuts in
// its own frame, and every mesh's contours and creases.
function meshStrokes(objects, { creaseAngle, eye, lines, style }) {
  const contours = [];
  const creases = [];
  const sections = [];
  objects.forEach((object, o) => {
    const faced = object.meshes.map((entry, m) => {
      const mesh = weldMesh(entry);
      const found = meshEdges(mesh, { creaseAngle, eye });
      const tag = (segment) =>
        segment.map(([key, point]) => [`${o}:${m}:${key}`, point]);
      contours.push(...found.contours.map(tag));
      if (object.creases !== false) creases.push(...found.creases.map(tag));
      return { facing: found.facing, mesh };
    });
    if (object.sections === false) return;
    AXES[style]?.forEach((axis) => {
      sections.push(
        chainKeyed(
          sectionCuts(faced, { axis, count: lines, inverse: object.inverse })
        )
      );
    });
  });
  return {
    contours: chainKeyed(contours),
    creases: chainKeyed(creases),
    sections: sections.flat(),
  };
}

// Line work for a dumpster fire: the solid pieces (dumpster, litter, wall,
// optionally the sidewalk) as section cuts, contours and creases; the fire
// and plume blobs as their own contours and slices; the smoke as stipple
// dots from its particles and flow lines along its paths; and, given the
// solids' depth `coverage` and the render, the silhouette, halo, shading,
// texture contours and smoke shading. Everything is projected through the
// capture camera and cut where (given `visible`) a nearer solid hides it.
export default function renderDumpsterSvg({
  camera,
  color = null,
  contours = true,
  coverage = null,
  creaseAngle = 35,
  edges = true,
  flames = true,
  height,
  image = null,
  lines = 8,
  outline = null,
  paper = '#ffffff',
  pixelRatio = 1,
  scene,
  shade = null,
  silhouette = false,
  smoke = null,
  smokeShade = null,
  stroke = 0.6,
  style = 'slices',
  texture = null,
  visible = null,
  width,
}) {
  const project = createProjector(camera, width, height);
  const onOutline =
    silhouette && coverage ? nearSilhouette(coverage, pixelRatio) : null;
  const covered =
    flames && scene.flames.length
      ? blobCover(scene.flames.map(blobSphere), { camera, height, project })
      : () => false;
  const hiddenBy =
    (edgeLike, behindFlames = false) =>
    (p) =>
      (visible && !visible(p.x, p.y, p.depth)) ||
      (edgeLike && onOutline && onOutline(p.x, p.y)) ||
      (behindFlames && covered(p));
  const trace = (polylines, edgeLike, minLength = 0, behindFlames = false) =>
    traceRuns(polylines, {
      height,
      hidden: hiddenBy(edgeLike, behindFlames),
      minLength,
      project,
      width,
    });
  const { eye } = camera;

  const solids = meshStrokes(scene.solids, { creaseAngle, eye, lines, style });
  const sliceRuns = trace(solids.sections, false, 2, true);
  const contourRuns = contours ? trace(solids.contours, true, 4, true) : [];
  const creaseRuns = edges ? trace(solids.creases, true, 4, true) : [];

  const flameRuns = [];
  if (flames && scene.flames.length) {
    const blobs = meshStrokes(scene.flames, {
      creaseAngle: 180,
      eye,
      lines: Math.max(3, Math.round(lines / 2)),
      style: style === 'none' ? 'none' : 'slices',
    });
    flameRuns.push(
      ...trace(blobs.contours, false, 3, true),
      ...trace(blobs.sections, false, 3, true)
    );
  }

  const palette =
    color && image && coverage
      ? imagePalette({ image, k: color.inks, mask: coverage })
      : [];
  const inkRuns = palette.length
    ? colorRuns(sliceRuns, { image, mask: coverage, palette, pixelRatio })
    : null;
  const sectionLayers = inkRuns
    ? palette
        .filter((entry) => inkRuns[entry.color]?.length)
        .map((entry, i) =>
          plotLayer(
            20 + i,
            `sections ${i + 1}`,
            stroke,
            pathOf(inkRuns[entry.color]),
            entry.color
          )
        )
        .join('')
    : '';

  let dots = '';
  if (smoke?.dots?.length && smoke.density > 0) {
    const rng = createRng(`dots:${smoke.seed ?? 0}`);
    const hidden = hiddenBy(false, true);
    const pen = Math.max(smoke.pen ?? stroke, 0.3);
    smoke.dots.forEach(([x, y, z, alpha]) => {
      if (rng() >= smoke.density * alpha) return;
      const p = project(x, y, z);
      if (p.depth <= 0 || p.x < 0 || p.y < 0 || p.x > width || p.y > height) {
        return;
      }
      if (hidden(p)) return;
      dots += dotPath(round(p.x), round(p.y), pen * 0.5, pen);
    });
  }
  const flowRuns = smoke?.flow?.length ? trace(smoke.flow, false, 6, true) : [];

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
  const smokeShading =
    smokeShade && smokeShade.contrast
      ? shadePath({
          ...smokeShade,
          height,
          image: smokeShade.contrast.image,
          mask: smokeShade.contrast.mask,
          pen: smokeShade.pen ?? stroke,
          pixelRatio,
          width,
        })
      : '';

  const layer = (index, label, d) =>
    d ? plotLayer(index, label, stroke, d) : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color:${paper}">` +
    `${!inkRuns && sliceRuns.length ? layer(0, 'sections', pathOf(sliceRuns)) : ''}` +
    `${sectionLayers}` +
    `${outlineLoops.length ? layer(1, 'silhouette', pathOf(outlineLoops)) : ''}` +
    `${layer(2, 'shading', shading)}` +
    `${contourRuns.length ? layer(3, 'contours', pathOf(contourRuns)) : ''}` +
    `${halo.length ? layer(4, 'outline', pathOf(halo)) : ''}` +
    `${creaseRuns.length ? layer(5, 'creases', pathOf(creaseRuns)) : ''}` +
    `${textureLines.length ? layer(6, 'texture', pathOf(textureLines)) : ''}` +
    `${flameRuns.length ? layer(7, 'flames', pathOf(flameRuns)) : ''}` +
    `${layer(8, 'smoke dots', dots)}` +
    `${flowRuns.length ? layer(9, 'smoke flow', pathOf(flowRuns)) : ''}` +
    `${layer(10, 'smoke shading', smokeShading)}</svg>`
  );
}

const shadeOf = (shading, spacing, options) =>
  shading && shading !== 'none'
    ? {
        angle: options.svgShadeAngle,
        gamma: options.svgShadeGamma,
        pen: penPx(options),
        shading,
        spacing,
      }
    : null;

// The render options a plot reads, as renderDumpsterSvg's arguments; a
// caller adds the camera, read-back scene and smoke, image and depth.
export function plotArgs(options) {
  return {
    color: options.svgColors > 0 ? { inks: options.svgColors } : null,
    contours: options.svgContours,
    creaseAngle: options.svgCreaseAngle,
    edges: options.svgEdges,
    flames: options.svgFlames,
    height: options.height,
    lines: options.svgLines,
    outline: outlineOf(options, null),
    paper: options.svgPaper,
    pixelRatio: options.pixelRatio,
    shade: shadeOf(options.svgShading, options.svgShadeSpacing, options),
    silhouette: options.svgSilhouette,
    smokeShade: shadeOf(
      options.svgSmokeShading,
      options.svgSmokeSpacing,
      options
    ),
    stroke: options.svgStroke,
    style: options.svgStyle,
    texture: options.svgTexture ? { levels: options.svgTextureLevels } : null,
    width: options.width,
  };
}

// Whether a plot needs the solids-only depth pass.
export const needsDepth = (options) =>
  Boolean(
    options.svgColors > 0 ||
    options.svgOcclusion ||
    options.svgSilhouette ||
    options.svgTexture ||
    (options.svgOutline && options.svgOutline !== 'none') ||
    (options.svgShading && options.svgShading !== 'none')
  );

// Whether a plot reads the render itself.
export const needsImage = (options) =>
  Boolean(
    options.svgColors > 0 ||
    options.svgTexture ||
    (options.svgShading && options.svgShading !== 'none')
  );

// Whether a plot needs a second render with the smoke hidden.
export const needsSmokeContrast = (options) =>
  Boolean(options.svgSmokeShading && options.svgSmokeShading !== 'none');
