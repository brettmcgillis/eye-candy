import { createRng } from '@modules/flora';

import { lightWindows } from './details';
import habitable from './habitable';
import monolith from './monolith';
import { boundsOf, createBook, inFootprint, weatherRecord } from './parts';
import spomenik from './spomenik';

const FAMILIES = { habitable, monolith, spomenik };

// Everything the renderers draw for one structure, from a flat config:
// parts, the cutters carved out of them, lit panes, and bounds. The order of
// rng calls inside a family is load-bearing — reordering changes every
// structure at the same seed.
export default function buildStructure(config) {
  const rng = createRng(`brutalist:${config.family}:${config.formSeed}`);
  const book = createBook(rng);
  const { ground } = (FAMILIES[config.family] ?? monolith)(book, config, rng);
  lightWindows(book, rng.fork('lit'), Math.round(config.litWindows));
  return {
    bounds: boundsOf(book.parts),
    cutters: book.cutters,
    ground,
    lights: book.lights,
    parts: book.parts,
  };
}

// Whether another part sits on or over a point.
function coverAbove(parts, self, x, z, y) {
  return parts.some((other) => {
    if (other === self) return false;
    const [top, bottom] = weatherRecord(other);
    return top > y + 0.3 && bottom < y + 0.5 && inFootprint(other, x, z, 0.5);
  });
}

// Open roof and ledge points a sapling could root in: tops of unleaned box
// parts that nothing sits on.
export function ledgePoints(structure, rng, count) {
  const tops = structure.parts.filter(
    (part) =>
      part.kind === 'box' &&
      !part.tilt &&
      !part.pitch &&
      ['mass', 'slab', 'plinth', 'core', 'parapet'].includes(part.role) &&
      part.half[0] > 0.6 &&
      part.half[2] > 0.6
  );
  const area = (part) => part.half[0] * part.half[2];
  const total = tops.reduce((sum, part) => sum + area(part), 0);
  const points = [];
  for (
    let attempt = 0;
    attempt < count * 12 && points.length < count;
    attempt += 1
  ) {
    let pick = rng() * total;
    const part =
      tops.find((p) => {
        pick -= area(p);
        return pick <= 0;
      }) ?? tops[tops.length - 1];
    if (!part) break;
    const lx = rng.signed() * (part.half[0] - 0.4);
    const lz = rng.signed() * (part.half[2] - 0.4);
    const c = Math.cos(part.yaw);
    const s = Math.sin(part.yaw);
    const x = part.center[0] + lx * c + lz * s;
    const z = part.center[2] - lx * s + lz * c;
    const y = part.center[1] + part.half[1];
    if (!coverAbove(structure.parts, part, x, z, y)) {
      points.push({ x, y, z });
    }
  }
  return points;
}
