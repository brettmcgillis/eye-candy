const scales = import.meta.hot?.data.brushScales || new WeakMap();
if (import.meta.hot) import.meta.hot.data.brushScales = scales;

export function configureBrush(brush, config) {
  // scaleBrushes multiplies persistent brush definitions rather than setting a scale.
  brush.scaleBrushes(1 / (scales.get(brush) || 1));
  // Native spray widens and deposits fewer subpixel dots as pressure rises.
  brush.add('spray', {
    type: 'spray',
    weight: 0.2 * config.sprayInk,
    scatter: 6,
    sharpness: 15,
    grain: 40,
    opacity: 90,
    spacing: 0.5,
    pressure: { curve: [0.2, 0.35], min_max: [0.7, 1] },
  });
  brush.add('Lab crayon', {
    type: 'default',
    weight: config.customWeight,
    scatter: config.customScatter,
    sharpness: config.customSharpness,
    grain: config.customGrain,
    opacity: config.customOpacity,
    spacing: config.customSpacing,
    pressure: [config.pressureStart, config.pressureMiddle, config.pressureEnd],
    rotate: 'none',
  });
  brush.add('Lab pastel', {
    type: 'spray',
    weight: config.customWeight * 2,
    scatter: config.customScatter,
    grain: config.customGrain,
    opacity: config.customOpacity,
    spacing: config.customSpacing,
    pressure: [config.pressureStart, config.pressureMiddle, config.pressureEnd],
    rotate: 'none',
  });
  brush.scaleBrushes(config.brushScale);
  scales.set(brush, config.brushScale);
  brush.set(config.brush, config.ink, config.strokeWeight);
  if (config.field !== 'none') {
    if (config.field === 'hand') brush.wiggle(config.wiggle);
    else brush.field(config.field);
  }
}

export function configureFill(brush, config, color = config.pigment) {
  brush.noFill();
  brush.noWash();
  if (config.fillMode === 'watercolor') {
    brush.fill(color, config.fillOpacity);
    brush.fillBleed(config.bleed, config.bleedDirection, config.bleedAngle);
    brush.fillTexture(
      config.granulation,
      config.border,
      config.scatter,
      config.colorSplit
    );
  }
  if (config.fillMode === 'flat wash') brush.wash(color, config.fillOpacity);
  if (config.hatchEnabled) {
    brush.hatch(config.hatchSpacing, config.hatchAngle, { rand: 0.15 });
    brush.hatchStyle(config.brush, config.ink, config.strokeWeight);
  }
}

export function makeRng(seed) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
