import { fractal3, perlin3 } from '@modules/materialxNoise';

export { perlin3, fractal3 };

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// FireAndSmokeGPU's flame positionNode for one vertex of its unit
// icosphere: position × baseRadius pushed along the normal by
// detail × flameRange + billow.
export function flameVertex(
  [px, py, pz],
  [nx, ny, nz],
  { baseRadius, detail, seed, time }
) {
  const a = time + seed;
  const flameRange = clamp01(
    fractal3(nx * 0.6 + a, ny * 0.6 + a, nz * 0.6 + a, 5, 2, 0.5) * 0.5 + 0.5
  );
  const k = baseRadius * 0.05;
  const t2 = time * 2;
  const billow =
    (fractal3(px * k + t2, py * k + t2, pz * k + t2, 3, 2, 0.5) * 2 - 1) * 2;
  const d = detail * flameRange + billow;
  return [
    px * baseRadius + nx * d,
    py * baseRadius + ny * d,
    pz * baseRadius + nz * d,
  ];
}
