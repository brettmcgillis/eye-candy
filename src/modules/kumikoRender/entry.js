import * as THREE from 'three';

import { TIER } from '@modules/kumiko';

import { tierDepths } from './frames';
import { MM, createPrismBuilder } from './prism';

export const KIND = { piece: 1, ring: 0, solid: 2, tile: 3 };

// Pulls a piece's ends in along its own axis, opening the joint a hair.
function shorten({ a, b, polygon }, gap) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (gap <= 0 || length === 0) return polygon;
  const d = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const k = Math.max(0.2, 1 - gap / length);
  return polygon.map(([x, y]) => {
    const along = (x - m[0]) * d[0] + (y - m[1]) * d[1];
    return [x - d[0] * along * (1 - k), y - d[1] * along * (1 - k)];
  });
}

// Cell-local millimetres (y down) to cell-local world units (y up); the
// instance supplies the turn and the place.
const local = ([x, y]) => [x * MM, -y * MM];
const run = (a, b, offset) => {
  const dx = b[0] - a[0];
  const dy = a[1] - b[1];
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l, offset];
};

function withTone(geometry, tones) {
  geometry.setAttribute('tone', new THREE.Float32BufferAttribute(tones, 3));
  return geometry;
}

// A baked cell's two meshes. Wood: its half of each jigumi side, the infill
// pieces and solid fill. Paper: its faces, each tinted on its own. `tone`
// is (kind, a random of its own, its share of the cell).
export default function entryGeometry(entry, config) {
  const depths = tierDepths(config);
  const strips = config.construction === 'strips';
  const wood = createPrismBuilder({ grain: true });
  const woodTones = [];
  const count = () => wood.vertexCount();
  const tag = (before, kind, random) => {
    for (let i = before; i < count(); i += 1) woodTones.push(kind, random, 0);
  };

  entry.ring.forEach(({ a, b, polygon }, i) => {
    const before = count();
    wood.add(
      polygon.map(local),
      ...depths[TIER.jigumi],
      undefined,
      run(a, b, i * 13)
    );
    tag(before, KIND.ring, 0.5);
  });
  entry.pieces.forEach((piece, i) => {
    const before = count();
    const [z0, z1] = depths[piece.tier] ?? depths[TIER.infill];
    const outline = strips ? shorten(piece, config.jointGap) : piece.polygon;
    wood.add(
      outline.map(local),
      z0,
      z1,
      undefined,
      run(piece.a, piece.b, i * 7.3)
    );
    tag(before, KIND.piece, piece.random);
  });
  entry.solids.forEach((poly, i) => {
    const before = count();
    const [z0, z1] = depths[TIER.infill];
    wood.add(poly.map(local), z0, z1 - 0.15 * MM, undefined, [0, 1, i * 5.1]);
    tag(before, KIND.solid, 0.5);
  });

  const paper = createPrismBuilder();
  const paperTones = [];
  entry.tiles.forEach((tile) => {
    const before = paper.vertexCount();
    paper.add(tile.poly.map(local), -0.3 * MM, -0.1 * MM);
    for (let i = before; i < paper.vertexCount(); i += 1) {
      paperTones.push(KIND.tile, tile.random, tile.size);
    }
  });

  return {
    paper: withTone(paper.build(), paperTones),
    wood: withTone(wood.build(), woodTones),
  };
}
