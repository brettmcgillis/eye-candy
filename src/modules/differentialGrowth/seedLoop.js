// A small closed loop in the tangent plane at `origin`, sampled at the
// engine's target edge length: the path the reference would have you draw.
export default function seedLoop(origin, normal, edge, radius = edge * 3) {
  const [nx, ny, nz] = normal;
  const up = Math.abs(ny) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ax = up[1] * nz - up[2] * ny;
  let ay = up[2] * nx - up[0] * nz;
  let az = up[0] * ny - up[1] * nx;
  const l = Math.hypot(ax, ay, az) || 1;
  ax /= l;
  ay /= l;
  az /= l;
  const bx = ny * az - nz * ay;
  const by = nz * ax - nx * az;
  const bz = nx * ay - ny * ax;
  const count = Math.max(6, Math.round((2 * Math.PI * radius) / edge));
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const c = Math.cos(a) * radius;
    const s = Math.sin(a) * radius;
    return {
      x: origin[0] + ax * c + bx * s,
      y: origin[1] + ay * c + by * s,
      z: origin[2] + az * c + bz * s,
    };
  });
}
