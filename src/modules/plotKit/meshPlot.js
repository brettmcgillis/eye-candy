import { imageSamples } from './color';
import { nearSilhouette, pathOf, plotLayer, silhouetteRuns } from './contours';
import withoutNear from './dedupe';
import createHiddenLines from './hiddenLines';
import { composeInks, inkAt, inkMap } from './inks';
import { simplifyLoop, smooth } from './lines';
import { chainKeyed, meshEdges, traceRuns, weldMesh } from './mesh';
import { foldClose, hex, nearestInk, samplePalette } from './palette.mjs';
import createProjector from './projector';
import textureRuns from './texture';

// How far (render px) a stroke on the rim looks for the subject's ink.
const RIM_REACH = 4;

// A mesh edge this close (px) to a stroke of the subject's own is its
// duplicate, and a piece of one shorter than EDGE_MIN is a speck.
const EDGE_REACH = 2;
const EDGE_MIN = 5;

// Any posed subject as hidden-line line work: every read-back mesh's
// occluding contours and creases and any `lines` of its own, projected through the capture camera and
// cut where (given `visible`) nearer surface hides them, plus the silhouette
// of the depth pass's `coverage`. Given the subject's `albedo`, the lines
// take its own colours — `inks` of them, a layer each — else they are drawn
// black in contours / creases / silhouette layers. What a bench with no
// line work of its own plots (ExhibitA, FractalAutomata, Trucheterie3D).
// `inkLuma` caps how light an ink is drawn. Given `occluders` (world triangle meshes, the subject's solid form), lines
// are cut exactly against them rather than probed through `visible`, so a
// corner stays a corner; a mesh entry's `color` (sRGB 0–255) inks its lines.
export default function meshPlotSvg({
  albedo = null,
  camera,
  contours = true,
  contourTolerance = 0.2,
  coverage = null,
  creaseAngle = 35,
  edges = true,
  height,
  inkLuma = null,
  inks = 8,
  lines = [],
  meshes,
  minLength = 3,
  occluders = null,
  outlineTolerance,
  palette: given = null,
  pixelRatio = 1,
  silhouette = true,
  stroke = 0.6,
  texture = null,
  visible = null,
  width,
}) {
  const project = createProjector(camera, width, height);
  const onOutline =
    silhouette && coverage ? nearSilhouette(coverage, pixelRatio) : null;
  const found = { contours: [], creases: [] };
  const colors = new Map();
  const hiddenLines = occluders
    ? createHiddenLines({
        camera,
        height,
        minLength: Math.min(minLength, 0.8),
        occluders,
        project,
        width,
      })
    : null;
  const exactOf = (segments, entry, tolerance = 0) =>
    hiddenLines(chainKeyed(segments)).map((exact) => {
      const run = tolerance
        ? smooth(
            simplifyLoop(
              exact.map((p) => [p.x, p.y]),
              tolerance
            )
          ).map(([x, y]) => ({ x, y }))
        : exact;
      colors.set(run, entry.color);
      return run;
    });
  const mine = { contours: [], creases: [] };
  meshes.forEach((entry, m) => {
    const edgesOf = meshEdges(weldMesh(entry), {
      boundaries: entry.boundaries,
      creaseAngle: entry.creaseAngle ?? creaseAngle,
      eye: camera.eye,
      smooth: entry.smooth,
    });
    const tag = (segment) =>
      segment.map(([key, point]) => [`${m}:${key}`, point]);
    // Not push(...): a dense mesh has more edges than the call stack has room.
    edgesOf.contours.forEach((segment) => found.contours.push(tag(segment)));
    edgesOf.creases.forEach((segment) => found.creases.push(tag(segment)));
    if (occluders) {
      mine.contours.push(
        ...exactOf(edgesOf.contours.map(tag), entry, contourTolerance)
      );
      mine.creases.push(...exactOf(edgesOf.creases.map(tag), entry));
    }
  });
  const trace = (segments, tolerance) =>
    traceRuns(chainKeyed(segments), {
      height,
      hidden: (p) =>
        (visible && !visible(p.x, p.y, p.depth)) ||
        (onOutline && onOutline(p.x, p.y)),
      minLength,
      project,
      tolerance,
      width,
    });
  const pick = (kind, enabled) => {
    if (!enabled) return [];
    return occluders
      ? mine[kind]
      : trace(found[kind], kind === 'contours' ? contourTolerance : undefined);
  };
  // A subject's own strokes (world polylines, already on its surface).
  const probed = () =>
    lines.length
      ? traceRuns(lines, {
          height,
          hidden: (p) => visible && !visible(p.x, p.y, p.depth),
          minLength,
          project,
          width,
        })
      : [];
  const lineRuns = hiddenLines ? hiddenLines(lines) : probed();
  // A mesh edge already drawn by a stroke of the subject's own (a rim, a
  // contour standing at its level) is not drawn again beside it.
  const distinct = (runs) =>
    hiddenLines
      ? withoutNear(runs, lineRuns, {
          minLength: EDGE_MIN,
          onKeep: (piece, run) => colors.set(piece, colors.get(run)),
          reach: EDGE_REACH,
        })
      : runs;
  const contourRuns = distinct(pick('contours', contours));
  const creaseRuns = distinct(pick('creases', edges));
  const outline =
    silhouette && coverage
      ? silhouetteRuns(
          coverage,
          pixelRatio,
          outlineTolerance && outlineTolerance * pixelRatio
        )
      : [];
  // Brightness contours of the render inside the subject, for a surface
  // with no mesh to read (a ray-marched field).
  const textureLines =
    texture && coverage
      ? textureRuns({
          coverage,
          image: texture.image,
          levels: texture.levels,
          pixelRatio,
        })
      : [];

  const open =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  // Inks under 1% of the subject are its antialiased edges, not colours:
  // the nearest real ink takes their pixels. A caller's `palette` (shared
  // with its shading) replaces the sampled one.
  const sampled =
    albedo && !given
      ? samplePalette(
          foldClose(imageSamples({ image: albedo, mask: albedo })),
          inks,
          { vivid: 1 }
        )
      : [];
  const kept = sampled.filter((entry) => entry.mass >= 0.01);
  const fallback = kept.length ? kept : sampled.slice(0, 1);
  const palette = given ?? fallback;
  // A pale render's inks would vanish on white paper: each is drawn no
  // lighter than `inkLuma` (0..1), its hue kept.
  const onPaper = (inksOf) =>
    inkLuma === null
      ? inksOf
      : inksOf.map((entry) => {
          const rgb = [1, 3, 5].map((i) =>
            Number.parseInt(entry.color.slice(i, i + 2), 16)
          );
          const luma =
            (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
          const k = luma > inkLuma ? inkLuma / luma : 1;
          return { ...entry, color: hex(rgb.map((v) => v * k)) };
        });
  if (palette.length) {
    const inside = albedo
      ? inkAt(inkMap({ image: albedo, mask: albedo, palette }), pixelRatio)
      : () => -1;
    // A stroke along the subject's rim lands a pixel outside its coverage:
    // it takes the ink of the nearest pixel within reach rather than none.
    const at = (x, y) => {
      let ink = inside(x, y);
      for (let reach = 1; ink < 0 && reach <= RIM_REACH; reach += 1) {
        const r = reach / pixelRatio;
        for (let k = 0; ink < 0 && k < 8; k += 1) {
          const a = (k * Math.PI) / 4;
          ink = inside(x + Math.cos(a) * r, y + Math.sin(a) * r);
        }
      }
      return ink;
    };
    const nearest = nearestInk(palette);
    const inked = (runs) => {
      if (!occluders) return [{ inkAt: at, runs }];
      const groups = new Map();
      runs.forEach((run) => {
        const color = colors.get(run);
        const ink = color ? nearest(color) : at(run[0].x, run[0].y);
        if (!groups.has(ink)) groups.set(ink, []);
        groups.get(ink).push(run);
      });
      return [...groups].map(([ink, list]) => ({
        inkAt: () => ink,
        runs: list,
      }));
    };
    // The silhouette sits just off the subject, so it takes the darkest ink.
    return `${open}${composeInks(
      onPaper(palette),
      [
        ...inked(contourRuns),
        ...inked(creaseRuns),
        { inkAt: at, runs: lineRuns },
        { inkAt: at, runs: textureLines },
        { d: outline.length ? pathOf(outline) : '', ink: 0 },
      ],
      { stroke }
    )}</svg>`;
  }
  return (
    `${open}${contourRuns.length ? plotLayer(0, 'contours', stroke, pathOf(contourRuns)) : ''}` +
    `${creaseRuns.length ? plotLayer(1, 'creases', stroke, pathOf(creaseRuns)) : ''}` +
    `${lineRuns.length ? plotLayer(3, 'strokes', stroke, pathOf(lineRuns)) : ''}` +
    `${textureLines.length ? plotLayer(4, 'texture', stroke, pathOf(textureLines)) : ''}` +
    `${outline.length ? plotLayer(2, 'silhouette', stroke, pathOf(outline)) : ''}</svg>`
  );
}
