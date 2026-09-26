// The camera maths a plottable render needs, shared by every strand kernel's
// SVG writer: world points through a model matrix and a three-style
// perspective camera into output pixels.

export function applyMatrix(m, [x, y, z]) {
  if (!m) return [x, y, z];
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

export function matrixScale(m) {
  return m ? Math.hypot(m[0], m[1], m[2]) : 1;
}

// Right-handed look-at, matching three's camera.
function viewBasis(eye, target) {
  const forward = [0, 1, 2].map((a) => eye[a] - target[a]);
  const flen = Math.hypot(...forward) || 1;
  const z = forward.map((v) => v / flen);
  // right = normalize(up × z), with up = (0,1,0)
  const right = [z[2], 0, -z[0]];
  const rlen = Math.hypot(...right) || 1;
  const x = rlen < 1e-6 ? [1, 0, 0] : right.map((v) => v / rlen);
  const y = [
    z[1] * x[2] - z[2] * x[1],
    z[2] * x[0] - z[0] * x[2],
    z[0] * x[1] - z[1] * x[0],
  ];
  return { x, y, z };
}

export function createProjector({ camera, height, width }) {
  const { eye, fov, target } = camera;
  const { x, y, z } = viewBasis(eye, target);
  const focal = height / 2 / Math.tan((fov * Math.PI) / 180 / 2);

  return function project(point) {
    const d = [0, 1, 2].map((a) => point[a] - eye[a]);
    const depth = -(d[0] * z[0] + d[1] * z[1] + d[2] * z[2]);
    if (depth <= 1e-4) return null;
    const px = d[0] * x[0] + d[1] * x[1] + d[2] * x[2];
    const py = d[0] * y[0] + d[1] * y[1] + d[2] * y[2];
    const scale = focal / depth;
    return {
      depth,
      scale,
      x: width / 2 + px * scale,
      y: height / 2 - py * scale,
    };
  };
}

export function formatPath(points) {
  return points
    .map(
      ({ x, y }, index) =>
        `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    )
    .join('');
}

export function circlePath(x, y, r) {
  const rr = r.toFixed(2);
  return `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${rr} ${rr} 0 1 0 ${(r * 2).toFixed(2)} 0a${rr} ${rr} 0 1 0 ${(-r * 2).toFixed(2)} 0`;
}
