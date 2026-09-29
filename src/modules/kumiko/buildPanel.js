import arrange from './arrangement';
import createPanelContext from './context';
import { cutByFrames } from './frames';
import {
  centroid,
  clipPolygon,
  lerp,
  pointInPolygon,
  signedArea,
} from './geometry';
import planCell from './planCell';
import applyTones from './tone';

const edgeKey = (a, b) => {
  const k = (p) => `${Math.round(p[0] * 100)},${Math.round(p[1] * 100)}`;
  return [k(a), k(b)].sort().join('|');
};

// A kumiko panel in millimetres, y down: border, nested frames, the cells
// and their leaves, the openings left between the strips, and every strip
// piece mitred at its joints.
export default function buildPanel(config, { image = null } = {}) {
  const ctx = createPanelContext(config, { image });
  const { frames, height, inner, innerPoly, pool, width } = ctx;

  const panel = {
    frames,
    height,
    inner,
    leaves: [],
    openings: [],
    pieces: [],
    solids: [],
    tiles: [],
    width,
  };
  const jigumi = new Map();

  ctx.cells().forEach((top) => {
    const { leaves, segments } = planCell(top, ctx);
    const first = panel.leaves.length;
    leaves.forEach((leaf, i) => panel.leaves.push({ ...leaf, id: first + i }));
    const leafAt = (p) => {
      const found = leaves.findIndex((leaf) => pointInPolygon(p, leaf.poly));
      return first + Math.max(0, found);
    };
    const { faces, pieces } = arrange(segments);

    faces.forEach((face) => {
      const leaf = leafAt(centroid(face.outline));
      const outline = clipPolygon(face.outline, innerPoly);
      if (outline.length < 3) return;
      const tile = {
        area: signedArea(outline),
        center: centroid(outline),
        kind: 'tile',
        leaf,
        opening: -1,
        poly: outline,
      };
      panel.tiles.push(tile);
      if (!face.opening) {
        panel.solids.push({ leaf, poly: outline });
        return;
      }
      const clipped = clipPolygon(face.opening, innerPoly);
      if (clipped.length < 3) return;
      cutByFrames(clipped, frames).forEach((poly) => {
        const area = signedArea(poly);
        if (area > 1e-2) {
          if (tile.opening < 0) tile.opening = panel.openings.length;
          panel.openings.push({
            area,
            center: centroid(poly),
            kind: 'opening',
            leaf,
            poly,
          });
        }
      });
    });

    pieces.forEach((piece) => {
      const mid = lerp(piece.a, piece.b, 0.5);
      if (piece.boundary) {
        const key = edgeKey(piece.a, piece.b);
        if (!jigumi.has(key))
          jigumi.set(key, { leaf: leafAt(mid), segment: piece });
        return;
      }
      const polygon = clipPolygon(piece.polygon, innerPoly);
      if (polygon.length < 3) return;
      panel.pieces.push({
        ...piece,
        center: mid,
        kind: 'piece',
        leaf: leafAt(mid),
        polygon,
      });
    });
  });

  // The jigumi is mitred as one panel-wide graph: a cell only knows its own
  // side of each joint, and pieces taken cell by cell overlap and leave gaps
  // where several cells meet.
  const frame = [...jigumi.values()];
  arrange(
    frame.map(({ segment }) => ({ ...segment })),
    { split: false }
  ).pieces.forEach((piece) => {
    const polygon = clipPolygon(piece.polygon, innerPoly);
    if (polygon.length < 3) return;
    const mid = lerp(piece.a, piece.b, 0.5);
    const owner = jigumi.get(edgeKey(piece.a, piece.b));
    panel.pieces.push({
      ...piece,
      center: mid,
      kind: 'piece',
      leaf: owner?.leaf ?? 0,
      polygon,
    });
  });

  panel.pool = pool.map(({ id }) => id);
  return applyTones(panel, config, {
    poolIndex: new Map(panel.pool.map((id, i) => [id, i])),
    zoneCount: ctx.zoneCount,
  });
}
