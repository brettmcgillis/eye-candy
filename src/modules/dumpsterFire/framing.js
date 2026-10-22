import { framePoints } from '@modules/plotKit';

import {
  DUMPSTER_FOOTPRINT,
  DUMPSTER_TOP,
  SCENE_ROOT_POSITION,
} from './constants';
import { VIEW_ANGLES } from './renderOptions.mjs';
import { ASSET_SIZE } from './trash';

const world = ([x, y, z]) => [
  x + SCENE_ROOT_POSITION[0],
  y + SCENE_ROOT_POSITION[1],
  z + SCENE_ROOT_POSITION[2],
];

function boxCorners([x0, y0, z0], [x1, y1, z1]) {
  return [
    [x0, y0, z0],
    [x1, y0, z0],
    [x0, y1, z0],
    [x1, y1, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x0, y1, z1],
    [x1, y1, z1],
  ];
}

// The world points a camera must fit: the dumpster and its litter, plus
// (framing the whole scene) the smoke paths, given as world points.
export function subjectBounds({ frame = 'scene', smoke = [], trash }) {
  const { max, min } = DUMPSTER_FOOTPRINT;
  const points = boxCorners(
    [min[0], 0, min[1]],
    [max[0], DUMPSTER_TOP, max[1]]
  ).map(world);
  [...trash.fixed, ...trash.dynamic]
    .filter((item) => frame === 'scene' || Math.abs(item.position[0]) < 4.5)
    .forEach(({ key, position }) => {
      const r = (ASSET_SIZE[key] ?? 0.3) * 0.5;
      const [x, y, z] = world(position);
      points.push(...boxCorners([x - r, y - r, z - r], [x + r, y + r, z + r]));
    });
  if (frame === 'scene') points.push(...smoke);
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  points.forEach((p) =>
    p.forEach((v, k) => {
      lo[k] = Math.min(lo[k], v);
      hi[k] = Math.max(hi[k], v);
    })
  );
  const center = lo.map((v, k) => (v + hi[k]) / 2);
  return {
    center,
    points,
    radius: Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2,
  };
}

export function anglesFor(config, view) {
  return view === 'hero' || !VIEW_ANGLES[view]
    ? { azimuth: config.viewAzimuth, elevation: config.viewElevation }
    : VIEW_ANGLES[view];
}

// A perspective camera fitted to the subject: azimuth 0 looks at the
// dumpster's front. The hero view also takes the generation's roll and
// shift.
export default function frameDumpster({
  azimuthOffset = 0,
  bounds,
  config,
  options,
  view = 'hero',
}) {
  const hero = view === 'hero';
  const angles = anglesFor(config, view);
  return framePoints({
    azimuth: angles.azimuth + azimuthOffset,
    elevation: angles.elevation,
    fov: options.fov,
    height: options.height,
    margin: options.margin,
    points: bounds.points,
    roll: hero ? (config.viewRoll ?? 0) : 0,
    shift: hero ? (config.viewShiftY ?? 0) : 0,
    width: options.width,
    zoom: hero ? config.viewZoom : 1,
  });
}
