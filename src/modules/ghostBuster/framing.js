import { VIEW_ANGLES } from './renderOptions.mjs';

const DEG = Math.PI / 180;

// The sphere a settled ghost fits in at scale 1, centred between its crown
// and hem (measured from GhostCharacter's drape under the default skins).
export const GHOST_BOUNDS = { center: [0, -0.32, 0], radius: 0.5 };

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v) => scale(v, 1 / (Math.hypot(...v) || 1));

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
  const aspect = options.width / options.height;
  const vfov = options.fov * DEG;
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
  const fit = Math.min(vfov, hfov);
  const half = Math.atan(Math.tan(fit / 2) * (1 - 2 * options.margin));
  const distance = bounds.radius / Math.sin(half) / (config.cameraZoom || 1);

  const azimuth = (angles.azimuth + azimuthOffset) * DEG;
  const elevation = angles.elevation * DEG;
  const outward = [
    Math.cos(elevation) * Math.sin(azimuth),
    Math.sin(elevation),
    Math.cos(elevation) * Math.cos(azimuth),
  ];
  const forward = scale(outward, -1);
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const roll = hero ? (config.cameraRoll ?? 0) * DEG : 0;
  const rolledUp = add(scale(up, Math.cos(roll)), scale(right, Math.sin(roll)));

  const frameHeight = 2 * distance * Math.tan(vfov / 2);
  const shift = hero ? (config.cameraShiftY ?? 0) : 0;
  const target = add(bounds.center, scale(rolledUp, -shift * frameHeight));
  const eye = add(target, scale(outward, distance));

  return {
    aspect,
    eye,
    far: distance + bounds.radius * 6,
    fov: options.fov,
    near: Math.max(0.01, distance - bounds.radius * 3),
    target,
    up: rolledUp,
  };
}

// World point → output pixels plus view depth (distance along the view
// axis, what a linear depth pass stores).
export function createProjector(camera, width, height) {
  const forward = normalize([
    camera.target[0] - camera.eye[0],
    camera.target[1] - camera.eye[1],
    camera.target[2] - camera.eye[2],
  ]);
  const right = normalize(cross(forward, camera.up));
  const up = cross(right, forward);
  const tanY = Math.tan((camera.fov * DEG) / 2);
  const tanX = tanY * (width / height);
  return (x, y, z) => {
    const v = [x - camera.eye[0], y - camera.eye[1], z - camera.eye[2]];
    const depth = dot(v, forward);
    return {
      depth,
      x: ((dot(v, right) / (depth * tanX) + 1) / 2) * width,
      y: ((1 - dot(v, up) / (depth * tanY)) / 2) * height,
    };
  };
}
