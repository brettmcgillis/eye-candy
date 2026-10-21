import { framePoints } from '@modules/plotKit';

import { VIEW_ANGLES } from './renderOptions.mjs';

export function anglesFor(config, view) {
  return view === 'hero' || !VIEW_ANGLES[view]
    ? { azimuth: config.cameraAzimuth, elevation: config.cameraElevation }
    : VIEW_ANGLES[view];
}

// A perspective camera round the flock, fitted to its birds' boxes:
// `azimuth` 0 looks at the faces of forward-facing birds. The hero view also takes the generation's roll and
// shift.
export default function frameFlock({
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
    roll: hero ? (config.cameraRoll ?? 0) : 0,
    shift: hero ? (config.cameraShiftY ?? 0) : 0,
    width: options.width,
    zoom: config.cameraZoom,
  });
}
