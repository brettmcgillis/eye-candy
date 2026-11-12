import splinePath from '@utils/splinePath';

import { OPENINGS, ROOF_Y } from './cruiser';

export const PATH_SAMPLES = 24;

const COLUMN_POINTS = 7;
const AXIS = [-0.3, -4];
const MERGE_Y = ROOF_Y + 0.9;
const MERGE_KEEP = 0.35;
const SALT = [0.13, 0.47, 0.71];

const norm = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l);
};

const toAxis = ([x, , z], keep, y) => [
  AXIS[0] + (x - AXIS[0]) * keep,
  y,
  AXIS[1] + (z - AXIS[1]) * keep,
];

// The way into the blaze over the roof. The cabin's fire rises straight
// through it; a window's flames lip out of the opening, climb the body
// beside it, and curl in to join the cabin's fire, so the car burns as one
// fire with tongues, not a ring of jets.
function flamePath({ at, core, out }) {
  if (core) return [at, [at[0], ROOF_Y, at[2]]];
  const o = norm(out);
  const lip = at.map((v, k) => v + o[k] * 0.12);
  const climb = [lip[0] + o[0] * 0.1, lip[1] + 0.55, lip[2] + o[2] * 0.1];
  return [at, lip, climb];
}

const pathLength = (path) =>
  path
    .slice(1)
    .reduce(
      (sum, b, i) => sum + Math.hypot(...b.map((v, k) => v - path[i][k])),
      0
    );

const sample = (points) =>
  splinePath(
    points.map(([x, y, z]) => ({ x, y, z })),
    { samples: PATH_SAMPLES }
  );

// The column the cabin's fire climbs, from its point over the roof: up to
// `height`, leaning downwind (`lean` along x, `drift` along z at the top).
// Each trail keeps `gather` of its offset from the column's axis, turning
// `twist` turns round it on the way up, so the column reads as billows wound
// together rather than one tube.
function columnFrom(merge, { drift, gather, height, lean, twist }) {
  const ox = merge[0] - AXIS[0];
  const oz = merge[2] - AXIS[1];
  const turn0 = Math.atan2(oz, ox);
  const reach = Math.hypot(ox, oz);
  return Array.from({ length: COLUMN_POINTS }, (_, i) => {
    const k = (i + 1) / COLUMN_POINTS;
    const bend = k ** 1.25;
    const angle = turn0 + twist * Math.PI * 2 * k;
    const r = reach * (1 + (gather - 1) * Math.min(1, k * 1.6));
    return [
      AXIS[0] + lean * bend + Math.cos(angle) * r,
      MERGE_Y + (height - MERGE_Y) * k,
      AXIS[1] + drift * bend + Math.sin(angle) * r,
    ];
  });
}

// Every source's trail, in world space. The cabin's carry on up the column;
// the openings' end inside the cabin's fire over the roof, as far along as
// the cabin's own trail has come by then, so where they meet they share its
// width and heat and only the cabin's trails make the smoke. All share one
// billow offset: it is one fire, and trails with their own would seam
// wherever the volume's choice of nearest trails changes.
export function buildTrails(layout) {
  const vents = OPENINGS.flatMap(({ key, vents: list }) =>
    list.map((vent) => ({ ...vent, key }))
  );
  const paths = vents.map((vent) => {
    const flame = flamePath(vent);
    const merge = toAxis(
      flame[flame.length - 1],
      vent.core ? 1 : MERGE_KEEP,
      MERGE_Y
    );
    return sample(
      vent.core
        ? [...flame, merge, ...columnFrom(merge, layout)]
        : [...flame, merge]
    );
  });
  const full = Math.max(
    ...paths.filter((_, i) => vents[i].core).map(pathLength),
    1
  );
  return vents.map(({ core, key, scale = 1 }, index) => ({
    key,
    path: paths[index],
    salt: SALT,
    scale,
    span: core ? 1 : Math.min(1, pathLength(paths[index]) / full),
  }));
}
