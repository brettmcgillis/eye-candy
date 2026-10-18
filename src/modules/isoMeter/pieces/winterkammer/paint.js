import { lerpColor } from '../../color';
import {
  edgeCorners,
  isLine,
  isOutline,
  latticeX,
  latticeY,
  triangleCorners,
} from '../../lattice';
import { BACKGROUND, LINE_COLOR } from './palettes';

export const FINAL_INK = lerpColor(BACKGROUND, LINE_COLOR, 0.8);
export const BACKGROUND_INK = lerpColor(BACKGROUND, LINE_COLOR, 0.85);
export const LINE_WIDTH = 0.7;

export const outlineWidth = (baseZoom) =>
  Math.max(Math.min(1.4 * baseZoom, 1.4), 0.7);

export function tileProjector(tile, scale = 1) {
  const L = 6 * tile.zoom;
  const { i, j, k } = tile.center;
  const ox = -latticeX(k - j, i - k, j - i) * L;
  const oy = -latticeY(k - j, i - k, j - i) * L;
  return ([a, b, c]) => [
    ox + latticeX(a, b, c) * L * scale,
    oy + latticeY(a, b, c) * L * scale,
  ];
}

export function framePolygon(tile, scale = 1) {
  const project = tileProjector(tile, scale);
  const { I, J, K } = tile.dims;
  return [
    [0, J, 0],
    [I, J, 0],
    [I, 0, 0],
    [I, 0, K],
    [0, 0, K],
    [0, J, K],
  ].map(([i, j, k]) => project([k - j, i - k, j - i]));
}

export function paintFills(painter, tile, include = () => true) {
  const project = tileProjector(tile);
  const tris = [];
  tile.lattice.map.forEach((tri) => {
    if (include(tri)) {
      tris.push({
        fill: tile.shade(tri),
        points: triangleCorners(tri).map(project),
      });
    }
  });
  painter.triangles(tris);
}

function edgeSegments(tile, test, include) {
  const project = tileProjector(tile);
  const { lattice } = tile;
  const segments = [];
  lattice.map.forEach((tri) => {
    if (!include(tri)) return;
    for (let edge = 0; edge < 3; edge += 1) {
      if (test(tri, lattice.neighbor(tri, edge))) {
        segments.push(edgeCorners(tri, edge).map(project));
      }
    }
  });
  return segments;
}

export function paintOutlines(
  painter,
  tile,
  { color, include = () => true, width }
) {
  const segments = edgeSegments(
    tile,
    (tri, nb) => isOutline(tri, nb, 2),
    include
  );
  painter.segments(segments, { color, width });
}

export function paintLines(
  painter,
  tile,
  { color, include = () => true, width }
) {
  const segments = edgeSegments(
    tile,
    (tri, nb) => isLine(tri, nb, 2, 6),
    include
  );
  painter.segments(segments, { color, width });
}
