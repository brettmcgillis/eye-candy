import { OUTLINE, collectEdges, triangleCorners } from './lattice';
import { projector } from './renderSvg';

export const OUTLINE_MODE_IDS = {
  all: OUTLINE.all,
  border: OUTLINE.border,
  none: OUTLINE.none,
};

function pushQuads(out, segments, project, width) {
  if (width <= 0) return;
  const h = width / 2;
  segments.forEach(([from, to]) => {
    const [x1, y1] = project(from);
    const [x2, y2] = project(to);
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const dx = ((x2 - x1) / len) * h;
    const dy = ((y2 - y1) / len) * h;
    const ax = x1 - dx;
    const ay = y1 - dy;
    const bx = x2 + dx;
    const by = y2 + dy;
    out.push(
      ax - dy,
      ay + dx,
      ax + dy,
      ay - dx,
      bx + dy,
      by - dx,
      ax - dy,
      ay + dx,
      bx + dy,
      by - dx,
      bx - dy,
      by + dx
    );
  });
}

export default function meshData(
  piece,
  build,
  {
    fill = true,
    lineWidth = 1,
    outlineMode = 'all',
    outlineWidth = 3,
    style = 'final',
    zoom = 1,
  } = {}
) {
  const project = projector(piece, { zoom });
  const heights = build.heights();
  const final = style === 'final';
  const tris = [...build.lattice.map.values()];

  const fillPositions = new Float32Array(fill ? tris.length * 6 : 0);
  const fillColors = new Uint8Array(fill ? tris.length * 9 : 0);
  if (fill) {
    tris.forEach((tri, n) => {
      const rgb = final ? piece.shade(tri, heights) : piece.background;
      triangleCorners(tri).forEach((corner, v) => {
        const [x, y] = project(corner);
        fillPositions[n * 6 + v * 2] = x;
        fillPositions[n * 6 + v * 2 + 1] = y;
        fillColors.set(rgb, n * 9 + v * 3);
      });
    });
  }

  const mode = OUTLINE_MODE_IDS[outlineMode] ?? OUTLINE.all;
  const { lines, outlines } = collectEdges(build.lattice, {
    outlineMode: mode,
    threshold: final ? piece.edgeThreshold : 1,
  });
  const ink = [];
  pushQuads(ink, outlines, project, outlineWidth);
  pushQuads(ink, lines, project, lineWidth);

  return {
    fillColors,
    fillPositions,
    inkPositions: Float32Array.from(ink),
    triangles: tris.length,
  };
}
