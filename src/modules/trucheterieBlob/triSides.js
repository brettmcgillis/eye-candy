/* eslint-disable no-bitwise */
import { cellCorners } from './triangle';

const cache = new WeakMap();

export function triangleSides(cells) {
  if (cache.has(cells)) return cache.get(cells);
  const links = Array.from({ length: cells.length * 3 }, () => new Set());
  const covered = new Int32Array(cells.length * 3);
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
        segments.get(key).push(id);
      }
    });
  });
  segments.forEach((owners) => {
    if (owners.length !== 2) return;
    const [a, b] = owners;
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
  const result = { groups, groupOf };
  cache.set(cells, result);
  return result;
}

export function normalizeTriangleSides(design, cells = design.cells) {
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
