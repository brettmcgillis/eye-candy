// The ESM source: the package's `main` is a UMD build that throws against
// the installed three-mesh-bvh when a headless renderer requires it.
// eslint-disable-next-line import/extensions
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg/src/index.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { weatherRecord } from '@modules/brutalist';

import { cutCode, solidGeometry } from './solids';

const evaluator = new Evaluator();
evaluator.useGroups = false;
evaluator.attributes = ['position', 'normal', 'aWeather'];

// One part with all its openings: the cutters are disjoint (the kernel
// refuses overlaps), so they merge into one brush and cost one boolean.
function carvePart(part, cutters) {
  const solid = solidGeometry(part);
  if (!cutters?.length) return solid;
  const [, , seed] = weatherRecord(part);
  const pieces = cutters.map((cutter) => {
    const [top, bottom] = weatherRecord(cutter);
    return solidGeometry(cutter, {
      code: cutCode(cutter.role, false),
      record: [top, bottom, seed, 0],
    });
  });
  const tool = mergeGeometries(pieces);
  pieces.forEach((piece) => piece.dispose());
  const a = new Brush(solid);
  const b = new Brush(tool);
  a.updateMatrixWorld();
  b.updateMatrixWorld();
  const result = evaluator.evaluate(a, b, SUBTRACTION).geometry;
  solid.dispose();
  tool.dispose();
  return result;
}

// The whole structure as one geometry: one draw call, one material.
export default function carveStructure(structure) {
  const byPart = new Map();
  structure.cutters.forEach((cutter) => {
    if (!byPart.has(cutter.part)) byPart.set(cutter.part, []);
    byPart.get(cutter.part).push(cutter);
  });
  const geometries = structure.parts.map((part) =>
    carvePart(part, byPart.get(part.id))
  );
  const merged = mergeGeometries(geometries);
  geometries.forEach((geometry) => geometry.dispose());
  merged.computeBoundingSphere();
  merged.computeBoundingBox();
  return merged;
}
