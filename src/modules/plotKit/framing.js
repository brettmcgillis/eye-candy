const DEG = Math.PI / 180;

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v) => scale(v, 1 / (Math.hypot(...v) || 1));

// A perspective camera fitting a bounding sphere: `azimuth` 0 looks down
// −Z from +Z, `elevation` is degrees above it, `zoom` above 1 crops in,
// `roll` tilts the frame and `shift` moves the subject up in frame heights.
export default function frameSphere({
  azimuth,
  bounds,
  elevation,
  fov,
  height,
  margin,
  roll = 0,
  shift = 0,
  width,
  zoom = 1,
}) {
  const aspect = width / height;
  const vfov = fov * DEG;
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
  const fit = Math.min(vfov, hfov);
  const half = Math.atan(Math.tan(fit / 2) * (1 - 2 * margin));
  const distance = bounds.radius / Math.sin(half) / (zoom || 1);

  const az = azimuth * DEG;
  const el = elevation * DEG;
  const outward = [
    Math.cos(el) * Math.sin(az),
    Math.sin(el),
    Math.cos(el) * Math.cos(az),
  ];
  const forward = scale(outward, -1);
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const tilt = roll * DEG;
  const rolledUp = add(scale(up, Math.cos(tilt)), scale(right, Math.sin(tilt)));

  const frameHeight = 2 * distance * Math.tan(vfov / 2);
  const target = add(bounds.center, scale(rolledUp, -shift * frameHeight));
  const eye = add(target, scale(outward, distance));

  return {
    aspect,
    eye,
    far: distance + bounds.radius * 6,
    fov,
    near: Math.max(0.01, distance - bounds.radius * 3),
    target,
    up: rolledUp,
  };
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// A perspective camera fitting a set of world points (a subject's box
// corners) from a direction, centred on what it sees rather than on a
// sphere — the fit for a wide, flat subject a sphere would leave
// letterboxed. Same angles and knobs as frameSphere.
export function framePoints({
  azimuth,
  elevation,
  fov,
  height,
  margin,
  points,
  roll = 0,
  shift = 0,
  width,
  zoom = 1,
}) {
  const aspect = width / height;
  const tanY = Math.tan((fov * DEG) / 2) * (1 - 2 * margin);
  const tanX = tanY * aspect;
  const az = azimuth * DEG;
  const el = elevation * DEG;
  const outward = [
    Math.cos(el) * Math.sin(az),
    Math.sin(el),
    Math.cos(el) * Math.cos(az),
  ];
  const forward = scale(outward, -1);
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);

  const centroid = [0, 1, 2].map(
    (k) => points.reduce((sum, p) => sum + p[k], 0) / points.length
  );
  let target = centroid;
  let distance = 1;
  const fit = () => {
    distance = Math.max(
      ...points.map((p) => {
        const v = [p[0] - target[0], p[1] - target[1], p[2] - target[2]];
        const along = dot(v, forward);
        return Math.max(
          Math.abs(dot(v, right)) / tanX - along,
          Math.abs(dot(v, up)) / tanY - along
        );
      }),
      0.05
    );
  };
  for (let pass = 0; pass < 3; pass += 1) {
    fit();
    const eye = add(target, scale(outward, distance));
    let lowX = Infinity;
    let highX = -Infinity;
    let lowY = Infinity;
    let highY = -Infinity;
    points.forEach((p) => {
      const v = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]];
      const depth = Math.max(dot(v, forward), 1e-6);
      const x = dot(v, right) / depth;
      const y = dot(v, up) / depth;
      lowX = Math.min(lowX, x);
      highX = Math.max(highX, x);
      lowY = Math.min(lowY, y);
      highY = Math.max(highY, y);
    });
    target = add(
      target,
      add(
        scale(right, ((lowX + highX) / 2) * distance),
        scale(up, ((lowY + highY) / 2) * distance)
      )
    );
  }
  fit();
  const reach = Math.max(
    ...points.map((p) =>
      Math.hypot(p[0] - target[0], p[1] - target[1], p[2] - target[2])
    )
  );
  const zoomed = distance / (zoom || 1);
  const tilt = roll * DEG;
  const rolledUp = add(scale(up, Math.cos(tilt)), scale(right, Math.sin(tilt)));
  const frameHeight = 2 * zoomed * Math.tan((fov * DEG) / 2);
  const shifted = add(target, scale(rolledUp, -shift * frameHeight));

  return {
    aspect,
    eye: add(shifted, scale(outward, zoomed)),
    far: zoomed + reach * 6,
    fov,
    near: Math.max(0.01, zoomed - reach * 3),
    target: shifted,
    up: rolledUp,
  };
}
