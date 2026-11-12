export default function revealField(config, size = 192) {
  const values = new Float32Array(size * size);
  let low = Infinity;
  let high = -Infinity;
  for (let y = 0; y < size; y += 1)
    for (let x = 0; x < size; x += 1) {
      const u = x / (size - 1);
      const v = y / (size - 1);
      let rank = Math.hypot(u - config.revealCenterX, v - config.revealCenterY);
      if (config.revealPattern === 'sweep') rank = u;
      if (config.revealPattern === 'spots') {
        rank = Infinity;
        for (let i = 0; i < config.animationPetals; i += 1) {
          const angle =
            (i / config.animationPetals) * Math.PI * 2 - Math.PI / 2;
          rank = Math.min(
            rank,
            Math.hypot(
              u - 0.5 - Math.cos(angle) * 0.2,
              v - 0.5 - Math.sin(angle) * 0.2
            )
          );
        }
      }
      rank +=
        (config.revealNoise *
          (Math.sin(u * 17 + config.seed) +
            Math.cos(v * 21 - config.seed) +
            Math.sin((u + v) * 31))) /
        6;
      values[y * size + x] = rank;
      low = Math.min(low, rank);
      high = Math.max(high, rank);
    }
  for (let i = 0; i < values.length; i += 1)
    values[i] = (values[i] - low) / Math.max(0.001, high - low);
  return { values, size };
}
