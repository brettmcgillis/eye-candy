import { framePoints } from '@modules/plotKit';

import { PAINTING_VIEW, VIEW_ANGLES } from './renderOptions.mjs';

export function anglesFor(config, view) {
  if (view !== 'hero' && VIEW_ANGLES[view]) return VIEW_ANGLES[view];
  return {
    azimuth: PAINTING_VIEW.azimuth + (config.viewAzimuth ?? 0),
    elevation: config.viewElevation ?? PAINTING_VIEW.elevation,
  };
}

export function boxCorners(min, max) {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
    [0, 1, 2].map((k) => (Math.floor(i / 2 ** k) % 2 ? max[k] : min[k]))
  );
}

// A perspective camera fitted to the posed subject's box. The hero view
// takes the generation's own roll and shift.
export default function frameRabbit({
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
    zoom: config.viewZoom ?? 1,
  });
}
