import animationAssets from './animationAssets';
import { ANIMATION_IDS } from './animationSettings';
import { cropStroke, heightMap, unmatteInk } from './canvasOutputs';
import { BRUSHES } from './experiments';
import paintStrokes from './paintStrokes';
import { configureBrush, configureFill, makeRng } from './paintStyle';
import { particleStamp, pigmentAssets } from './studioAssets';

function curve(config, y, x = 35, width = 690) {
  return [
    [x, y, config.pressureStart],
    [x + width * 0.27, y - 22, config.pressureMiddle],
    [x + width * 0.65, y + 25, config.pressureMiddle],
    [x + width, y, config.pressureEnd],
  ];
}

function drawCabinet(brush, config) {
  configureBrush(brush, config);
  BRUSHES.forEach((name, index) => {
    brush.set(name, config.ink, config.strokeWeight);
    brush.spline(curve(config, 36 + index * 39, 175, 545), config.curvature);
  });
  brush.set(config.brush, config.ink, config.strokeWeight * 1.5);
  brush.spline(
    [
      [75, 660, config.pressureStart],
      [210, 560, config.pressureMiddle],
      [400, 690, config.pressureMiddle],
      [600, 575, config.pressureMiddle],
      [700, 650, config.pressureEnd],
    ],
    config.curvature
  );
}

function addLabels(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(canvas.width / 768, canvas.height / 768);
  ctx.font = '15px monospace';
  ctx.fillStyle = '#4b4a44';
  BRUSHES.forEach((name, index) => ctx.fillText(name, 24, 42 + index * 39));
  ctx.fillText('SELECTED BRUSH · PRESSURE + CURVATURE', 75, 735);
  ctx.restore();
}

function washPasses(config, study) {
  const rng = makeRng(config.seed);
  const passes = Array.from({ length: config.washCount }, (_, index) => {
    const x = 130 + rng() * 490;
    const y = 130 + rng() * 490;
    const radius = study ? 160 + rng() * 65 : 210 + rng() * 130;
    const polygon = Array.from({ length: 8 }, (_p, corner) => {
      const angle = (corner / 8) * Math.PI * 2;
      return [
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius * 0.75,
      ];
    });
    return (brush) => {
      configureBrush(brush, config);
      configureFill(
        brush,
        config,
        index % 2 ? config.pigmentB : config.pigment
      );
      if (!study) brush.noStroke();
      brush.polygon(polygon);
    };
  });
  if (config.dryLayers) return passes;
  return [(brush) => passes.forEach((pass) => pass(brush))];
}

function drawSprite(brush, config) {
  configureBrush(brush, config);
  configureFill(brush, config);
  brush.beginShape(0.6);
  [
    [384, 80],
    [560, 260],
    [570, 470],
    [384, 690],
    [198, 470],
    [208, 260],
  ].forEach(([x, y]) => brush.vertex(x, y));
  brush.endShape(true);
  brush.noFill();
  brush.noWash();
  brush.noHatch();
  brush.spline(
    [
      [384, 680, 0.6],
      [355, 440, 0.8],
      [400, 220, 0.5],
      [384, 95, 0.1],
    ],
    0.6
  );
  for (let i = 0; i < 5; i += 1) {
    brush.line(378, 240 + i * 65, 245 + i * 8, 205 + i * 65);
    brush.line(385, 240 + i * 65, 520 - i * 8, 205 + i * 65);
  }
}

export default async function paintAssets(runtime, config, strokes = []) {
  if (ANIMATION_IDS.includes(config.experiment))
    return animationAssets(runtime, config);
  const started = performance.now();
  let passes = washPasses(config, config.experiment === 'washes');
  if (config.experiment === 'marks')
    passes = [(brush) => drawCabinet(brush, config)];
  if (strokes.length) passes.push((brush) => paintStrokes(brush, strokes));
  let main = await runtime.paint(passes, config);
  if (!main) return null;
  if (config.experiment === 'marks') addLabels(main);
  const stroke = await runtime.paint(
    [
      (brush) => {
        configureBrush(brush, { ...config, field: 'none' });
        brush.spline(
          [
            [-24, 384, config.pressureStart],
            [384, 384, config.pressureMiddle],
            [792, 384, config.pressureEnd],
          ],
          0
        );
      },
    ],
    config,
    true
  );
  if (!stroke) return null;
  const strip = unmatteInk(cropStroke(stroke), config.ink);
  const sprite = await runtime.paint(
    [(brush) => drawSprite(brush, config)],
    config,
    true
  );
  if (!sprite) return null;
  const extra = {};
  if (config.experiment === 'masks') {
    const pigment = await pigmentAssets(runtime, config);
    if (!pigment) return null;
    main = pigment.main;
    extra.coverage = pigment.coverage;
  }
  if (config.experiment === 'particles') {
    const stamp = await particleStamp(runtime, config);
    if (config.particleKind !== 'leaves' && !stamp) return null;
    extra.particle = stamp || sprite;
  }
  return {
    ...extra,
    main,
    stroke: strip,
    sprite,
    height: heightMap(main),
    millis: performance.now() - started,
  };
}
