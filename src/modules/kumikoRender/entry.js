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

  const paperLayout =
    config.paintLayout === 'paper' && config.paintStyle !== 'original';
  if (!paperLayout) {
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
  }
  if (paperLayout && config.paintStyle === 'pencil') {
    const looseness = (config.paintStrokeRoughness ?? 0.5) * 2;
    entry.tiles.forEach(({ opening, random }) => {
      opening?.forEach((a, i) => {
        const b = opening[(i + 1) % opening.length];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const length = Math.hypot(dx, dy) || 1;
        const nx = -dy / length;
        const ny = dx / length;
        const passes = looseness === 0 ? 1 : 2 + Number(i % 4 === 0);
        for (let pass = 0; pass < passes; pass += 1) {
          const point = (t) => {
            const drift =
              (Math.sin(t * 5 + i * 7.1 + random * 131 + pass * 17) * 0.45 +
                pass * 0.25) *
              looseness;
            return [a[0] + dx * t + nx * drift, a[1] + dy * t + ny * drift];
          };
          for (let step = 0; step < 6; step += 1) {
            const from = point(step / 6 - (0.025 + random * 0.035) * looseness);
            const to = point(
              (step + 1) / 6 + (0.025 + random * 0.035) * looseness
            );
            const width =
              0.18 + Math.sin(i + step * 1.9 + random * 11) * 0.08 * looseness;
            const before = count();
            wood.add(
              [
                [from[0] + nx * width, from[1] + ny * width],
                [to[0] + nx * width, to[1] + ny * width],
                [to[0] - nx * width, to[1] - ny * width],
                [from[0] - nx * width, from[1] - ny * width],
              ].map(local),
              0,
              0.02 * MM,
              undefined,
              [0, 1, 0]
            );
            tag(before, KIND.piece, random + pass * 0.1);
          }
        }
      });
    });
  }

  const paper = createPrismBuilder({
    washBoundary: config.paintStyle === 'watercolor',
  });
  const paperTones = [];
  const openingIdentities = [];
  entry.tiles.forEach((tile, index) => {
    const before = paper.vertexCount();
    if (paperLayout && !tile.opening) return;
    paper.add(
      (paperLayout ? tile.opening : tile.poly).map(local),
      -0.3 * MM,
      -0.1 * MM
    );
    for (let i = before; i < paper.vertexCount(); i += 1) {
      paperTones.push(KIND.tile, tile.random, tile.size);
      openingIdentities.push(index + 1);
    }
  });

  const paperGeometry = withTone(paper.build(), paperTones);
  if (!paperGeometry.hasAttribute('paintBoundary'))
    paperGeometry.setAttribute(
      'paintBoundary',
      new THREE.Float32BufferAttribute(
        new Float32Array(paperGeometry.getAttribute('position').count),
        1
      )
    );
  const coordinates = paperGeometry.getAttribute('paintCoordinates');
  const shape = openingIdentities.flatMap((id, index) => [
    id + (coordinates?.getX(index) ?? 0) * 0.25,
    paperGeometry.getAttribute('paintBoundary').getX(index),
    coordinates?.getY(index) ?? 0,
    coordinates?.getZ(index) ?? 0,
  ]);
  paperGeometry.deleteAttribute('paintCoordinates');
  paperGeometry.deleteAttribute('paintBoundary');
  paperGeometry.setAttribute(
    'paintOpening',
    new THREE.Float32BufferAttribute(shape, 4)
  );
  return {
    paper: paperGeometry,
    wood: withTone(wood.build(), woodTones),
  };
}
