/* eslint-disable no-bitwise */
import buildOctree from './octree';
import buildRectSubdiv from './rectSubdiv';

const MIN_EXTENT = 1e-6;

export const halfExtents = (config) => [
  config.domainX,
  config.domainY,
  config.domainZ,
];

// Both partitions share one shape: an internal node holds its cut `u` as a
// fraction of its box per axis and eight children (bit a set = the upper side
// of axis a); a leaf holds its dice.
export default function buildTree(config) {
  const half = halfExtents(config);
  const built =
    config.structure === 'octree'
      ? buildOctree(config)
      : buildRectSubdiv(config, half);
  return { ...built, half };
}

const smooth = (x) => x * x * (3 - 2 * x);

export function growWeight(grow, depth) {
  if (grow == null) return 1;
  return smooth(Math.min(Math.max(grow - depth, 0), 1));
}

export function treeDepth(node) {
  if (!node.children) return 0;
  return 1 + Math.max(...node.children.map(treeDepth));
}

// The leaf boxes of `from` morphing into `to` at `t`, with every cut scaled
// by the grow weight of its depth. A side that does not split a box
// collapses its cut onto the lower walls, so the upper octant fills the box
// and its descendants read as the leaf that side has there: a split grows
// in, and a merge folds away, without a cell ever leaving the domain.
export function layoutCells({ from, grow = null, half, t = 0, to = null }) {
  const cells = [];

  function walk(a, b, lo, hi, depth, leafA, leafB) {
    const splitA = a?.children ? a.u : null;
    const splitB = to && b?.children ? b.u : null;
    const heldA = a?.leaf ?? leafA;
    const heldB = to ? (b?.leaf ?? leafB) : heldA;

    if (!splitA && !splitB) {
      cells.push({ a: heldA, b: heldB, depth, hi, lo });
      return;
    }

    const weight = growWeight(grow, depth);
    const u = [0, 1, 2].map((axis) => {
      const ua = splitA ? splitA[axis] * weight : 0;
      if (!to) return ua;
      const ub = splitB ? splitB[axis] * weight : 0;
      return ua + (ub - ua) * t;
    });
    const cut = u.map((v, axis) => lo[axis] + (hi[axis] - lo[axis]) * v);

    for (let octant = 0; octant < 8; octant += 1) {
      const childLo = [];
      const childHi = [];
      let open = true;
      for (let axis = 0; axis < 3; axis += 1) {
        const upper = (octant >> axis) & 1;
        childLo[axis] = upper ? cut[axis] : lo[axis];
        childHi[axis] = upper ? hi[axis] : cut[axis];
        if (childHi[axis] - childLo[axis] < MIN_EXTENT) open = false;
      }
      if (open) {
        walk(
          splitA ? a.children[octant] : null,
          splitB ? b.children[octant] : null,
          childLo,
          childHi,
          depth + 1,
          splitA ? null : heldA,
          splitB ? null : heldB
        );
      }
    }
  }

  walk(
    from,
    to,
    half.map((h) => -h),
    half,
    0,
    null,
    null
  );
  return cells;
}
