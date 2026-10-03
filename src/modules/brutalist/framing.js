/* eslint-disable no-bitwise */
import {
  VIEW_AZIMUTHS,
  VIEW_ELEVATION,
  VIEW_ELEVATIONS,
} from './renderOptions.mjs';

const DEG = Math.PI / 180;
const UP = [0, 1, 0];
const EYE_HEIGHT = 1.7;

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (v) => {
  const length = Math.hypot(...v) || 1;
  return v.map((c) => c / length);
};
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const scaleBounds = ({ max, min }, scale, lift) => ({
  max: max.map((v, a) => v * scale + (a === 1 ? lift : 0)),
  min: min.map((v, a) => v * scale + (a === 1 ? lift : 0)),
});

// Where the structure sits in scene units on a stage: full size in the
// forest, scaled onto the plinth top in the studio.
export function stageTransform(config, structure, stage) {
  if (stage !== 'maquette') return { lift: 0, scale: 1 };
  const height = structure.bounds.max[1] - Math.max(structure.bounds.min[1], 0);
  return {
    lift: config.plinthHeight,
    scale: config.modelHeight / Math.max(height, 1),
  };
}

// The camera a still or a frame is drawn through. `approach` stands a
// person's height above the ground at the treeline and looks up at the
// structure through a long lens; the others fit its bounds from a bearing.
// `stable` fits the bounding sphere so a moving camera never changes zoom.
export default function frameView({
  azimuthOffset = 0,
  distanceScale = 1,
  options,
  stable = false,
  stage = 'forest',
  structure,
  transform,
  view,
  standoff = 0,
  groundAt = () => 0,
}) {
  const { lift, scale } = transform;
  const bounds = scaleBounds(structure.bounds, scale, lift);
  bounds.min[1] = Math.max(bounds.min[1], lift);
  const azimuth = (VIEW_AZIMUTHS[view] + azimuthOffset) * DEG;
  const center = bounds.min.map((v, a) => (v + bounds.max[a]) / 2);
  const radius = Math.hypot(...bounds.max.map((v, a) => v - bounds.min[a])) / 2;
  const aspect = options.width / options.height;
  const tanY = Math.tan((options.fov * DEG) / 2) * (1 - options.margin * 2);
  const tanX = tanY * aspect;

  if (view === 'approach') {
    const height = bounds.max[1] - bounds.min[1];
    const reach =
      stage === 'maquette'
        ? Math.max(radius * 2.2, height * 2.6)
        : Math.max(standoff + 30, height * 1.9);
    const distance = reach * distanceScale;
    const eye = [
      center[0] + Math.cos(azimuth) * distance,
      0,
      center[2] + Math.sin(azimuth) * distance,
    ];
    eye[1] =
      lift +
      (stage === 'maquette' ? 0.04 : groundAt(eye[0], eye[2]) + EYE_HEIGHT);
    return {
      eye,
      far: stage === 'maquette' ? 200 : 6000,
      fov: options.fov,
      near: stage === 'maquette' ? 0.01 : 0.5,
      projection: 'perspective',
      target: [center[0], lift + height * 0.42, center[2]],
      up: UP,
    };
  }

  const elevation = (VIEW_ELEVATIONS[view] ?? VIEW_ELEVATION) * DEG;
  const z = [
    Math.cos(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.sin(azimuth) * Math.cos(elevation),
  ];
  const x = normalize(cross(UP, z));
  const y = cross(z, x);
  const offsets = Array.from({ length: 8 }, (_, i) =>
    [0, 1, 2].map(
      (a) => ((i >> a) & 1 ? bounds.max[a] : bounds.min[a]) - center[a]
    )
  );
  const distance =
    distanceScale *
    (stable
      ? radius / Math.sin(Math.atan(Math.min(tanX, tanY)))
      : Math.max(
          ...offsets.map((o) => {
            const toward = dot(o, z);
            return Math.max(
              toward + Math.abs(dot(o, x)) / tanX,
              toward + Math.abs(dot(o, y)) / tanY
            );
          })
        ));
  const eye = center.map((v, a) => v + z[a] * distance);
  eye[1] = Math.max(
    eye[1],
    lift + (stage === 'maquette' ? 0.05 : groundAt(eye[0], eye[2]) + EYE_HEIGHT)
  );
  return {
    eye,
    far: distance * 40 + 2000,
    fov: options.fov,
    near: Math.max(0.01, (distance - radius * 1.5) * 0.5),
    projection: 'perspective',
    target: center,
    up: UP,
  };
}
