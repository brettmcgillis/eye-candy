// The guide field a fire sim pulls its gas along: for every cell, the
// velocity of the nearest stretch of each path (its tangent times `speed`),
// weighted by `strength` and a gaussian falloff `radius` wide, and by
// `taper` fading the pull toward the path's end so the gas can leave it
// under its own buoyancy. Paths are box-space polylines (x right, y up,
// centred on the box), sampled densely enough to read as curves.
//
// Returns rgba per cell, x fastest: the weighted mean velocity and the
// summed weight (clamped to 1).
export default function bakeGuide({ grid, paths, size }) {
  const [GX, GY, GZ] = grid;
  const out = new Float32Array(GX * GY * GZ * 4);
  const segments = [];
  paths.forEach(({ points, radius, speed, strength = 1, taper = 0 }) => {
    const lengths = [0];
    for (let i = 1; i < points.length; i += 1) {
      const [ax, ay, az] = points[i - 1];
      const [bx, by, bz] = points[i];
      lengths.push(lengths[i - 1] + Math.hypot(bx - ax, by - ay, bz - az));
    }
    const total = lengths[lengths.length - 1] || 1;
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const len = lengths[i] - lengths[i - 1];
      if (len > 1e-6) {
        segments.push({
          a,
          d,
          len,
          radius,
          speed,
          strength,
          taper,
          from: lengths[i - 1] / total,
          to: lengths[i] / total,
          tangent: d.map((v) => v / len),
        });
      }
    }
  });
  if (!segments.length) return out;

  for (let z = 0; z < GZ; z += 1) {
    const pz = ((z + 0.5) / GZ - 0.5) * size[2];
    for (let y = 0; y < GY; y += 1) {
      const py = ((y + 0.5) / GY - 0.5) * size[1];
      for (let x = 0; x < GX; x += 1) {
        const px = ((x + 0.5) / GX - 0.5) * size[0];
        let vx = 0;
        let vy = 0;
        let vz = 0;
        let weight = 0;
        segments.forEach((s) => {
          const rx = px - s.a[0];
          const ry = py - s.a[1];
          const rz = pz - s.a[2];
          const h = Math.min(
            1,
            Math.max(
              0,
              (rx * s.d[0] + ry * s.d[1] + rz * s.d[2]) / (s.len * s.len)
            )
          );
          const dx = rx - s.d[0] * h;
          const dy = ry - s.d[1] * h;
          const dz = rz - s.d[2] * h;
          const q = (dx * dx + dy * dy + dz * dz) / (s.radius * s.radius);
          if (q < 9) {
            const along = s.from + (s.to - s.from) * h;
            const w = s.strength * Math.exp(-q) * (1 - s.taper * along);
            vx += s.tangent[0] * s.speed * w;
            vy += s.tangent[1] * s.speed * w;
            vz += s.tangent[2] * s.speed * w;
            weight += w;
          }
        });
        const o = ((z * GY + y) * GX + x) * 4;
        if (weight > 1e-6) {
          out[o] = vx / weight;
          out[o + 1] = vy / weight;
          out[o + 2] = vz / weight;
          out[o + 3] = Math.min(1, weight);
        }
      }
    }
  }
  return out;
}
