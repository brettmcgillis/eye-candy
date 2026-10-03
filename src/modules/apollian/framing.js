import { BOUNDS_EXTENT_CUBE, OPEN_RADIUS, boundRadius } from './fields';
import {
  DEG,
  add3,
  applyMat3,
  directionOf,
  objectRotation,
  scale3,
} from './math';
import { VIEW_AZIMUTHS, VIEW_ELEVATIONS } from './renderOptions.mjs';

// How far the rotated bound reaches below its centre, in object units.
function reachDown(config) {
  const m = objectRotation(config.objectTilt, config.objectSpin);
  if (config.bound === 'disc') {
    const t = Math.abs(config.objectTilt * DEG);
    return Math.sin(t) + Math.cos(t) * config.discHalf;
  }
  if (config.bound === 'cube') {
    let low = 0;
    [-1, 1].forEach((x) =>
      [-1, 1].forEach((y) =>
        [-1, 1].forEach((z) => {
          const p = applyMat3(m, [
            x * BOUNDS_EXTENT_CUBE,
            y * config.cubeHalf,
            z * BOUNDS_EXTENT_CUBE,
          ]);
          low = Math.max(low, -p[1]);
        })
      )
    );
    return low;
  }
  if (config.bound === 'open') return OPEN_RADIUS;
  return 1;
}

// World placement of the object, plinth and floor. The object's centre is
// the world origin; everything else hangs below it.
export function stageLayout(config) {
  const size = config.objectSize;
  const radius = boundRadius(config) * size;
  const bottom = -reachDown(config) * size;
  const plinth = config.bound === 'open' ? 'none' : config.plinth;
  const plinthTop = bottom - config.plinthGap * size;
  const plinthHeight = plinth === 'none' ? 0 : config.plinthHeight * size;
  const floorY = plinthTop - plinthHeight;
  const plinthWidth = config.plinthWidth * size;
  const span = Math.max(radius, plinth === 'none' ? 0 : plinthWidth);
  const lowest = config.floorEnabled || plinth !== 'none' ? floorY : bottom;
  return {
    bounds: {
      max: [span, radius, span],
      min: [-span, lowest, -span],
    },
    floorY,
    plinth,
    plinthHeight,
    plinthTop,
    plinthWidth,
    radius,
    size,
  };
}

// A camera that fits the object and plinth from a named bearing. A stable
// fit (turntable, drifting clips) fits the cylinder round the stage so the
// zoom never breathes.
export default function frameView({
  azimuthOffset = 0,
  layout,
  options,
  view,
}) {
  const { max, min } = layout.bounds;
  const target = [0, (max[1] + min[1]) / 2, 0];
  const halfY = (max[1] - min[1]) / 2;
  const radius = Math.hypot(max[0], halfY);
  const aspect = options.width / options.height;
  const margin = 1 + options.margin;
  const azimuth = (VIEW_AZIMUTHS[view] ?? VIEW_AZIMUTHS.hero) + azimuthOffset;
  const elevation = VIEW_ELEVATIONS[view] ?? VIEW_ELEVATIONS.hero;
  const dir = directionOf(azimuth, elevation);
  const up = view === 'top' ? [0, 0, -1] : [0, 1, 0];

  if (options.projection === 'orthographic') {
    const halfHeight = Math.max(radius, radius / aspect) * margin;
    const eye = add3(target, scale3(dir, radius * 4));
    return {
      eye,
      far: radius * 8,
      halfHeight,
      halfWidth: halfHeight * aspect,
      near: radius * 0.05,
      projection: 'orthographic',
      target,
      up,
    };
  }
  const vHalf = (options.fov * DEG) / 2;
  const hHalf = Math.atan(Math.tan(vHalf) * aspect);
  const distance = (radius * margin) / Math.sin(Math.min(vHalf, hHalf));
  return {
    eye: add3(target, scale3(dir, distance)),
    far: distance + radius * 6,
    fov: options.fov,
    near: Math.max(distance - radius * 3, 0.01),
    projection: 'perspective',
    target,
    up,
  };
}
