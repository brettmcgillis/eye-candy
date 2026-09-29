import { createRng } from '@modules/flora';

import arrange from './arrangement';
import { regularPolygon } from './geometry';
import { PATTERNS, PATTERN_IDS, fitsShape } from './patterns';

const SHAPES = [3, 4, 6, 8];
const INNER = [0.2, 0.42, 0.7];

// Every pattern on every cell shape it fits, checked for strips that float
// free of the jigumi: a ring nothing holds up can't be built.
export default function auditPatterns() {
  const defects = [];
  SHAPES.forEach((sides) => {
    const poly = regularPolygon([0, 0], 50, sides, 0.3);
    PATTERN_IDS.filter((id) => fitsShape(id, sides)).forEach((id) => {
      INNER.forEach((inner) => {
        const infill = PATTERNS[id].build(
          poly,
          { iceCuts: 6, inner, inset: 0.32, twist: 0.18 },
          createRng(`${id}:${sides}`)
        );
        const segments = [
          ...poly.map((a, i) => ({
            a,
            b: poly[(i + 1) % sides],
            boundary: true,
            width: 5,
          })),
          ...infill.map((s) => ({ ...s, width: 3 })),
        ];
        const { edges, nodes } = arrange(segments);
        const root = nodes.map((_, i) => i);
        const find = (i) => {
          if (root[i] !== i) root[i] = find(root[i]);
          return root[i];
        };
        edges.forEach((e) => {
          root[find(e.u)] = find(e.v);
        });
        const held = find(edges.find((e) => e.boundary).u);
        if (nodes.some((_, i) => find(i) !== held)) {
          defects.push(`${id} floats free on a ${sides}-gon (inner ${inner})`);
        }
      });
    });
  });
  return defects;
}
