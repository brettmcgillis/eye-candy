import { framePoints } from '@modules/plotKit';

import { isLit } from './flameStates';
import { VIEW_ANGLES } from './renderOptions.mjs';
import { flameCentre } from './wax';

const DEG = Math.PI / 180;

// Candle space → world: the candle stands at the origin, leaning `tilt`
// degrees about z (in the view plane of the front camera).
export function candleToWorld(config, [x, y, z]) {
  const a = (config.tilt ?? 0) * DEG;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c, z];
}

// The half-turn that carries the top end onto the bottom one.
export const mirrorEnd = ([x, y, z]) => [-x, -y, z];

// Where the top flame sits and how far its light and smoke reach, in
// candle space: the points a camera has to fit.
export function candleBounds(config, form) {
  const { radial } = form.extent;
  const top = form.rimAt(0);
  const flame = flameCentre(form);
  const tipHeight = isLit(config) ? 0.55 * (config.flameSize ?? 1) : 0.05;
  const smokeReach =
    config.smoke === 'none' ? 0 : 1.2 + Math.min(1.6, config.smokeRise ?? 0.5);
  const topPoints = [
    [-radial, top - form.radius * 1.4, -radial],
    [radial, top - form.radius * 1.4, radial],
    [-radial, top, radial],
    [radial, top, -radial],
    [flame[0], flame[1] + tipHeight, flame[2]],
    [flame[0] - 0.4, flame[1] + tipHeight + smokeReach, flame[2]],
    [flame[0] + 0.4, flame[1] + tipHeight + smokeReach, flame[2]],
  ];
  const body = [
    [-radial, -form.half, -radial],
    [radial, form.half, radial],
    [radial, -form.half, -radial],
    [-radial, form.half, radial],
  ];
  const all = [...body, ...topPoints, ...topPoints.map(mirrorEnd)];
  const world = (points) => points.map((p) => candleToWorld(config, p));
  return {
    end: world(topPoints),
    lowest: Math.min(...world(all).map((p) => p[1])),
    points: world(all),
  };
}

// A camera for a view of the candle (the shape plotKit's projector and the
// stage's `aim` read).
export default function frameCandle({
  azimuthOffset = 0,
  bounds,
  options,
  view = 'hero',
}) {
  const angles = VIEW_ANGLES[view] ?? VIEW_ANGLES.hero;
  return framePoints({
    azimuth: angles.azimuth + azimuthOffset,
    elevation: angles.elevation,
    fov: options.fov,
    height: options.height,
    margin: options.margin,
    points: view === 'end' ? bounds.end : bounds.points,
    width: options.width,
  });
}
