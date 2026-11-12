const watercolorStages = [
  [110, 0.2, 0.5, 0.5, 0],
  [95, 0.12, 0.6, 0.7, 3],
  [80, 0.06, 0.4, 0.8, 6],
].map(
  ([opacity, bleed, strength, grain, inset]) =>
    (brush, { s, unit = 1, triangle = false }) => {
      brush.fill('#000000', opacity);
      brush.fillBleed(bleed);
      brush.fillTexture(strength, grain);
      const half = s - inset * unit;
      if (triangle) {
        const center = -s / 3;
        const factor = half / s;
        brush.polygon(
          [
            [-s, -s],
            [s, -s],
            [-s, s],
          ].map(([x, y]) => [
            center + (x - center) * factor,
            center + (y - center) * factor,
          ])
        );
      } else brush.rect(-half, -half, half * 2, half * 2);
    }
);

export default watercolorStages;
