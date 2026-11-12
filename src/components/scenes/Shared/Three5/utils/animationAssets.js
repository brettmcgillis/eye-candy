import {
  fillMotifPass,
  inkMotifPass,
  motifPasses,
  paintMotif,
} from './animationMotif';
import { unmatteInk } from './canvasOutputs';

export default async function animationAssets(runtime, config) {
  const started = performance.now();
  let main;
  if (config.experiment === 'paintSequence') {
    main = document.createElement('canvas');
    main.width = config.resolution;
    main.height = config.resolution;
  } else main = await runtime.paint(motifPasses(config), config);
  if (!main) return null;
  const animation = { shapes: paintMotif(config), layers: [], inks: [] };
  if (config.experiment === 'paintSequence') {
    const banks = await Promise.all(
      animation.shapes.map(async (shape) => {
        const layer = await runtime.paint(
          [fillMotifPass(shape, config)],
          config,
          true
        );
        if (!layer) return null;
        const ink = await runtime.paint(
          [inkMotifPass(shape, config)],
          config,
          true
        );
        if (!ink) return null;
        return {
          layer: unmatteInk(layer, shape.color),
          ink: unmatteInk(ink, config.ink),
        };
      })
    );
    if (banks.some((bank) => !bank)) return null;
    animation.layers = banks.map((bank) => bank.layer);
    animation.inks = banks.map((bank) => bank.ink);
    const ctx = main.getContext('2d');
    ctx.fillStyle = config.paper;
    ctx.fillRect(0, 0, main.width, main.height);
    if (config.sequenceOrder !== 'ink then wash')
      animation.layers.forEach((layer) => ctx.drawImage(layer, 0, 0));
    animation.inks.forEach((ink) => ctx.drawImage(ink, 0, 0));
    if (config.sequenceOrder === 'ink then wash')
      animation.layers.forEach((layer) => ctx.drawImage(layer, 0, 0));
  }
  return { main, animation, millis: performance.now() - started };
}
