function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

// Bilinear read of the baked bed, in the same world-to-cell mapping the
// kernels use. The grain layout needs it on the CPU to decide which grains are
// rock, so it has to agree with the GPU's reading of the same array exactly.
export default function sampleField(
  field,
  resolution,
  worldSize,
  worldX,
  worldZ,
  channel = 0
) {
  const n = resolution;
  const fx = (worldX / worldSize + 0.5) * (n - 1);
  const fz = (0.5 - worldZ / worldSize) * (n - 1);
  const x0 = Math.min(n - 1, Math.max(0, Math.floor(fx)));
  const z0 = Math.min(n - 1, Math.max(0, Math.floor(fz)));
  const x1 = Math.min(n - 1, x0 + 1);
  const z1 = Math.min(n - 1, z0 + 1);
  const tx = clamp01(fx - x0);
  const tz = clamp01(fz - z0);

  const at = (ix, iz) => field[(iz * n + ix) * 4 + channel];
  const top = at(x0, z0) + (at(x1, z0) - at(x0, z0)) * tx;
  const bottom = at(x0, z1) + (at(x1, z1) - at(x0, z1)) * tx;
  return top + (bottom - top) * tz;
}
