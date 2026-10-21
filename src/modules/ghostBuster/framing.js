import { frameSphere } from '@modules/plotKit';

import { VIEW_ANGLES } from './renderOptions.mjs';

export { createProjector } from '@modules/plotKit';

// The sphere a settled ghost fits in at scale 1, centred between its crown
// and hem (measured from GhostCharacter's drape under the default skins).
export const GHOST_BOUNDS = { center: [0, -0.32, 0], radius: 0.5 };

// Roomy enough for a waving or clapping hand, and fixed, so the frames of
// an animation keep one camera.
export const MOTION_BOUNDS = { center: [0, -0.3, 0], radius: 0.6 };

export const animated = (config) =>
  Boolean(config.animation && config.animation !== 'none');

// The clock a still is taken at: the settle, plus the time into its
// animation.
export const stillTime = (config) =>
  config.settle + (animated(config) ? (config.animationAt ?? 0) : 0);

export function anglesFor(config, view) {
  return view === 'hero' || !VIEW_ANGLES[view]
    ? { azimuth: config.cameraAzimuth, elevation: config.cameraElevation }
    : VIEW_ANGLES[view];
}

// A perspective camera round the ghost: `azimuth` 0 looks at its face. The
// hero view also takes the generation's roll and shift.
export default function frameGhost({
  azimuthOffset = 0,
  bounds = GHOST_BOUNDS,
  config,
  options,
  view = 'hero',
}) {
  const hero = view === 'hero';
  const angles = anglesFor(config, view);
  return frameSphere({
    azimuth: angles.azimuth + azimuthOffset,
    bounds,
    elevation: angles.elevation,
    fov: options.fov,
    height: options.height,
    margin: options.margin,
    roll: hero ? (config.cameraRoll ?? 0) : 0,
    shift: hero ? (config.cameraShiftY ?? 0) : 0,
    width: options.width,
    zoom: config.cameraZoom,
  });
}
