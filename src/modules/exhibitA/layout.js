import createExhibitField from './fields';
import {
  DEG,
  add3,
  applyMat3,
  directionOf,
  objectRotation,
  scale3,
} from './math';
import { VIEW_AZIMUTHS, VIEW_ELEVATIONS } from './renderOptions.mjs';

const FIELD_GRID = 36;

// The lowest point of the exhibit as it stands (tilt and spin applied), in
// object units: where a mount rod meets it. Among the points near the bottom
// the one nearest the vertical axis is taken, so the rod stands as centrally
// as the shape allows.
export function exhibitFootprint(config, build) {
  const m = objectRotation(config.objectTilt, config.objectSpin);
  const lowest = [];
  let minY = Infinity;
  const consider = (p, band) => {
    if (p[1] < minY - band) {
      [, minY] = p;
      lowest.length = 0;
    }
    if (p[1] <= minY + band) lowest.push(p);
  };

  if (build.kind === 'mesh') {
    Object.values(build.parts).forEach(({ positions }) => {
      for (let i = 0; i < positions.length; i += 3) {
        consider(
          applyMat3(m, [positions[i], positions[i + 1], positions[i + 2]]),
          0.02
        );
      }
    });
  } else {
    const field = createExhibitField(config);
    const r = build.radius;
    const step = (2 * r) / FIELD_GRID;
    // Row-major transpose of a rotation is its inverse.
    const mt = [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
    for (let j = 0; j <= FIELD_GRID; j += 1) {
      const y = -r + j * step;
      if (y > minY + step) break;
      for (let i = 0; i <= FIELD_GRID; i += 1) {
        for (let k = 0; k <= FIELD_GRID; k += 1) {
          const w = [-r + i * step, y, -r + k * step];
          if (Math.hypot(...w) <= r) {
            if (field.distance(applyMat3(mt, w)) < 0) consider(w, step * 1.5);
          }
        }
      }
    }
  }

  if (lowest.length === 0)
    return { bottom: -build.radius, mount: [0, -build.radius, 0] };
  const mount = lowest.reduce((best, p) =>
    Math.hypot(p[0], p[2]) < Math.hypot(best[0], best[2]) ? p : best
  );
  return { bottom: minY, mount };
}

// World placement of the exhibit, plinth, mount and floor. The exhibit's
// centre is the world origin; everything else hangs below it.
export function stageLayout(config, build, footprint) {
  const size = config.objectSize;
  const radius = build.radius * size;
  const bottom = footprint.bottom * size;
  const { plinth } = config;
  const plinthTop = bottom - config.plinthGap * size;
  const plinthHeight = plinth === 'none' ? 0 : config.plinthHeight * size;
  const floorY = plinthTop - plinthHeight;
  const plinthWidth = config.plinthWidth * size;
  const span = Math.max(radius, plinth === 'none' ? 0 : plinthWidth);
  const lowest = config.floorEnabled || plinth !== 'none' ? floorY : bottom;
  const mountOn = config.mount && plinth !== 'none' && config.plinthGap > 0.001;
  return {
    bounds: { max: [span, radius, span], min: [-span, lowest, -span] },
    floorY,
    mount: mountOn
      ? {
          from: [
            footprint.mount[0] * size,
            plinthTop,
            footprint.mount[2] * size,
          ],
          to: scale3(footprint.mount, size),
        }
      : null,
    plinth,
    plinthHeight,
    plinthTop,
    plinthWidth,
    radius,
    size,
  };
}

// A camera that fits the exhibit and plinth from a named bearing.
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
