import { imageSamples } from './color';
import { nearSilhouette, pathOf, plotLayer, silhouetteRuns } from './contours';
import { composeInks, inkAt, inkMap } from './inks';
import { chainKeyed, meshEdges, traceRuns, weldMesh } from './mesh';
import { foldClose, samplePalette } from './palette.mjs';
import createProjector from './projector';
import textureRuns from './texture';

// Any posed subject as hidden-line line work: every read-back mesh's
// occluding contours and creases and any `lines` of its own, projected through the capture camera and
// cut where (given `visible`) nearer surface hides them, plus the silhouette
// of the depth pass's `coverage`. Given the subject's `albedo`, the lines
// take its own colours — `inks` of them, a layer each — else they are drawn
// black in contours / creases / silhouette layers. What a bench with no
// line work of its own plots (ExhibitA, FractalAutomata, Trucheterie3D).
export default function meshPlotSvg({
  albedo = null,
  camera,
  contours = true,
  coverage = null,
  creaseAngle = 35,
  edges = true,
  height,
  inks = 8,
  lines = [],
  meshes,
  minLength = 3,
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
  meshes.forEach((entry, m) => {
    const edgesOf = meshEdges(weldMesh(entry), {
      creaseAngle,
      eye: camera.eye,
    });
    const tag = (segment) =>
      segment.map(([key, point]) => [`${m}:${key}`, point]);
    // Not push(...): a dense mesh has more edges than the call stack has room.
    edgesOf.contours.forEach((segment) => found.contours.push(tag(segment)));
    edgesOf.creases.forEach((segment) => found.creases.push(tag(segment)));
  });
  const trace = (segments) =>
    traceRuns(chainKeyed(segments), {
      height,
      hidden: (p) =>
        (visible && !visible(p.x, p.y, p.depth)) ||
        (onOutline && onOutline(p.x, p.y)),
      minLength,
      project,
      width,
    });
  const contourRuns = contours ? trace(found.contours) : [];
  const creaseRuns = edges ? trace(found.creases) : [];
  // A subject's own strokes (world polylines, already on its surface).
  const lineRuns = lines.length
    ? traceRuns(lines, {
        height,
        hidden: (p) => visible && !visible(p.x, p.y, p.depth),
        minLength,
        project,
        width,
      })
    : [];
  const outline =
    silhouette && coverage ? silhouetteRuns(coverage, pixelRatio) : [];
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
  const palette = albedo && given ? given : fallback;
  if (palette.length) {
    const at = inkAt(
      inkMap({ image: albedo, mask: albedo, palette }),
      pixelRatio
    );
    // The silhouette sits just off the subject, so it takes the darkest ink.
    return `${open}${composeInks(
      palette,
      [
        { inkAt: at, runs: contourRuns },
        { inkAt: at, runs: creaseRuns },
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
