import { float, select, smoothstep } from 'three/tsl';

import { polygonAt } from '@utils/regularPolygonNodes';

// How strongly a cell sits in the band just inside the rim that faces
// `towards` (+1 for the +z edge, -1 for the -z edge). Reduces to the old
// row-count band for a square at rotation 0, and follows the rim round a
// circle or into the V of a rotated hexagon.
export default function bedRimBand(point, shape, reach, towards) {
  const { distance, facet } = polygonAt(point, shape);
  const inset = distance.negate();
  const near = float(1).sub(smoothstep(0, reach, inset));
  const faces = smoothstep(0.2, 0.7, facet.y.mul(towards));

  return select(distance.lessThan(0), near.mul(faces), float(0));
}
