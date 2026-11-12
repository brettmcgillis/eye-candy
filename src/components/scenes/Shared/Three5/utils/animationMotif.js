import { configureBrush, configureFill } from './paintStyle';

export function paintMotif(config, phase = 0, amount = 0) {
  const t = phase * Math.PI * 2;
  const petals = Array.from({ length: config.animationPetals }, (_, index) => {
    const angle = (index / config.animationPetals) * Math.PI * 2 - Math.PI / 2;
    const swing = amount * Math.sin(t + index * 1.3) * 0.22;
    const radius = 152 + amount * Math.sin(t * 2 + index) * 22;
    const cx = 384 + Math.cos(angle + swing) * radius;
    const cy = 384 + Math.sin(angle + swing) * radius;
    const points = Array.from({ length: 24 }, (_p, j) => {
      const a = (j / 24) * Math.PI * 2;
      const length = 175 * (1 + amount * Math.sin(t + index) * 0.15);
      const width = 93 * (1 + amount * Math.cos(t - index) * 0.2);
      const x = Math.cos(a) * length;
      const y = Math.sin(a) * width;
      return [
        cx + x * Math.cos(angle + swing) - y * Math.sin(angle + swing),
        cy + x * Math.sin(angle + swing) + y * Math.cos(angle + swing),
      ];
    });
    return { points, color: index % 2 ? config.pigmentB : config.pigment };
  });
  petals.push({
    points: Array.from({ length: 24 }, (_p, j) => {
      const a = (j / 24) * Math.PI * 2;
      return [384 + Math.cos(a) * 65, 384 + Math.sin(a) * 65];
    }),
    color: config.pigmentB,
  });
  return petals;
}

export function fillMotifPass(shape, config) {
  return (brush) => {
    configureFill(brush, { ...config, hatchEnabled: false }, shape.color);
    brush.noStroke();
    brush.polygon(shape.points);
  };
}

export function inkMotifPass(shape, config) {
  return (brush) => {
    configureBrush(brush, { ...config, field: 'none' });
    brush.noFill();
    brush.noWash();
    brush.noHatch();
    brush.spline(
      [...shape.points, shape.points[0]].map(([x, y]) => [x, y, 1]),
      config.curvature
    );
  };
}

export function motifPasses(config, phase = 0, amount = 0) {
  const passes = paintMotif(config, phase, amount).map((shape) =>
    fillMotifPass(shape, config)
  );
  return config.dryLayers
    ? passes
    : [(brush) => passes.forEach((pass) => pass(brush))];
}
