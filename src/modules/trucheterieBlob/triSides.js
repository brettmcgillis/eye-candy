/* eslint-disable no-bitwise */
import { cellCorners } from './triangle';

const cache = new WeakMap();

export function triangleSides(cells) {
  if (cache.has(cells)) return cache.get(cells);
  const links = Array.from({ length: cells.length * 3 }, () => new Set());
  const covered = new Int32Array(cells.length * 3);
  // The side id facing each unit of a side, from its corner towards the next.
  const partners = cells.map(({ size }) =>
    [0, 1, 2].map(() => new Int32Array(size).fill(-1))
  );
  const segments = new Map();
  cells.forEach((cell, index) => {
    const points = cellCorners({ ...cell, up: (cell.mask & 8) !== 0 });
    points.forEach(([a, b], side) => {
      const [c, d] = points[(side + 1) % 3];
      for (let k = 0; k < cell.size; k += 1) {
        const from = `${a + ((c - a) * k) / cell.size},${b + ((d - b) * k) / cell.size}`;
        const to = `${a + ((c - a) * (k + 1)) / cell.size},${b + ((d - b) * (k + 1)) / cell.size}`;
        const key = [from, to].sort().join(':');
        const id = index * 3 + side;
        if (!segments.has(key)) segments.set(key, []);
        segments.get(key).push([id, k]);
      }
    });
  });
  segments.forEach((owners) => {
    if (owners.length !== 2) return;
    const [[a, ka], [b, kb]] = owners;
    partners[Math.floor(a / 3)][a % 3][ka] = b;
    partners[Math.floor(b / 3)][b % 3][kb] = a;
    links[a].add(b);
    links[b].add(a);
    covered[a] += 1;
    covered[b] += 1;
  });
  const groups = [];
  const groupOf = [];
  links.forEach((_, first) => {
    if (groupOf[first]) return;
    const group = { members: [], openable: true };
    const queue = [first];
    groupOf[first] = group;
    for (let k = 0; k < queue.length; k += 1) {
      const id = queue[k];
      group.members.push(id);
      if (covered[id] !== cells[Math.floor(id / 3)].size)
        group.openable = false;
      links[id].forEach((next) => {
        if (groupOf[next]) return;
        groupOf[next] = group;
        queue.push(next);
      });
    }
    groups.push(group);
  });
  const result = { groups, groupOf, partners };
  cache.set(cells, result);
  return result;
}

// With irregular connections a subdivision design opens and closes each
// stretch two sides share on its own. A stretch's state lives on the side it
// covers whole (the smaller cell's), or on both when each covers the other
// or neither does; a side that holds no stretch shows whether any is open.
const unitsOf = (sides, id) => sides.partners[Math.floor(id / 3)][id % 3];
const covers = (sides, id, other) =>
  unitsOf(sides, id).every((partner) => partner === other);
const isOpenBit = (masks, id) =>
  (masks[Math.floor(id / 3)] & (1 << (id % 3))) !== 0;

function stretchOwners(sides, a, b) {
  const wa = covers(sides, a, b);
  const wb = covers(sides, b, a);
  if (wa !== wb) return wa ? [a] : [b];
  return [a, b];
}

const ownsStretch = (sides, id) =>
  unitsOf(sides, id).some(
    (other) => other >= 0 && stretchOwners(sides, id, other).includes(id)
  );

function stretchIsOpen(design, sides, masks, a, b) {
  return design.irregular
    ? stretchOwners(sides, a, b).every((id) => isOpenBit(masks, id))
    : isOpenBit(masks, a) && isOpenBit(masks, b);
}

// Each side's closed runs, [from, to) in units along it, and whether any of
// a run faces a cell (so its return overlaps that cell's own).
export function closedRuns(design, cells = design.cells) {
  const sides = triangleSides(cells);
  const masks = cells.map(({ mask }) => mask);
  return cells.map((_, index) =>
    [0, 1, 2].map((side) => {
      const runs = [];
      unitsOf(sides, index * 3 + side).forEach((other, k) => {
        const open =
          other >= 0 &&
          stretchIsOpen(design, sides, masks, index * 3 + side, other);
        const last = runs.at(-1);
        if (open) return;
        if (last && last.to === k) {
          last.to = k + 1;
          last.facing ||= other >= 0;
        } else runs.push({ from: k, to: k + 1, facing: other >= 0 });
      });
      return runs;
    })
  );
}

// A straight's lanes cross both open sides whole, and nothing crosses the
// closed one, so with irregular connections every stretch must agree.
export const straightSidesAgree = (runs, mask, size) =>
  [0, 1, 2].every((side) =>
    mask & (1 << side)
      ? runs[side].length === 0
      : runs[side].length === 1 &&
        runs[side][0].to - runs[side][0].from === size
  );

// The cells joined to one through open stretches.
export function openNeighbours(design, index, cells = design.cells) {
  const sides = triangleSides(cells);
  const masks = cells.map(({ mask }) => mask);
  const out = new Set();
  [0, 1, 2].forEach((side) =>
    unitsOf(sides, index * 3 + side).forEach((other) => {
      if (
        other >= 0 &&
        stretchIsOpen(design, sides, masks, index * 3 + side, other)
      )
        out.add(Math.floor(other / 3));
    })
  );
  return [...out];
}

function normalizeIrregular(design, cells) {
  const sides = triangleSides(cells);
  const masks = cells.map(({ mask }) => mask);
  const stored = masks.slice();
  cells.forEach((_, index) =>
    [0, 1, 2].forEach((side) => {
      const id = index * 3 + side;
      const units = unitsOf(sides, id);
      if (ownsStretch(sides, id) && units.some((other) => other >= 0)) return;
      const open = units.some(
        (other) => other >= 0 && stretchIsOpen(design, sides, stored, id, other)
      );
      masks[index] = open
        ? masks[index] | (1 << side)
        : masks[index] & ~(1 << side);
    })
  );
  return {
    ...design,
    cells: cells.map((cell, index) => ({ ...cell, mask: masks[index] })),
  };
}

export function normalizeTriangleSides(design, cells = design.cells) {
  if (design.irregular) return normalizeIrregular(design, cells);
  const masks = cells.map(({ mask }) => mask);
  triangleSides(cells).groups.forEach(({ members, openable }) => {
    if (
      openable &&
      members.every((id) => masks[Math.floor(id / 3)] & (1 << (id % 3)))
    )
      return;
    members.forEach((id) => {
      masks[Math.floor(id / 3)] &= ~(1 << (id % 3));
    });
  });
  return {
    ...design,
    cells: cells.map((cell, index) => ({ ...cell, mask: masks[index] })),
  };
}

export function setTriangleSide(design, index, side, open) {
  if (design.irregular) {
    const sides = triangleSides(design.cells);
    const id = index * 3 + side;
    const owners = new Set();
    unitsOf(sides, id).forEach((other) => {
      if (other >= 0)
        stretchOwners(sides, id, other).forEach((owner) => owners.add(owner));
    });
    if (owners.size === 0) return design;
    const masks = design.cells.map(({ mask }) => mask);
    owners.forEach((owner) => {
      const cell = Math.floor(owner / 3);
      const bit = 1 << (owner % 3);
      masks[cell] = open ? masks[cell] | bit : masks[cell] & ~bit;
    });
    return normalizeIrregular(
      design,
      design.cells.map((cell, at) => ({ ...cell, mask: masks[at] }))
    );
  }
  const group = triangleSides(design.cells).groupOf[index * 3 + side];
  if (!group || (open && !group.openable)) return design;
  const masks = design.cells.map(({ mask }) => mask);
  group.members.forEach((id) => {
    const cell = Math.floor(id / 3);
    const bit = 1 << (id % 3);
    masks[cell] = open ? masks[cell] | bit : masks[cell] & ~bit;
  });
  return {
    ...design,
    cells: design.cells.map((cell, at) => ({ ...cell, mask: masks[at] })),
  };
}
