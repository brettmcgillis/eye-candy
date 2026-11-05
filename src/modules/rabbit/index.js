// The three-free half of RabbitCLI and the Stay Hunted scene: option schema,
// roll, the arrow volley, framing and the plot. The stage it frames is
// @modules/rabbitRender.
export {
  default as layoutVolley,
  EMBED_DEPTH,
  FLETCH_HEIGHT,
  FLETCH_INSET,
  FLETCH_LENGTH,
  MAX_ARROWS,
  PAINTING_VOLLEY,
  POSE_TIME,
  RIBBON_LENGTH,
  RIBBON_TIE_INSET,
  RIBBON_WIDTH,
  RIBBON_WRAP_RADIUS,
  SHAFT_RADIUS,
  arrowDirection,
} from './arrows';
export { default as frameRabbit, anglesFor, boxCorners } from './framing';
export { default as furStrokes } from './fur';
export { default as grassBlades } from './grass';
export {
  default as renderRabbitSvg,
  needsCoverage,
  needsDepth,
  needsImage,
  plotArgs,
  plotColors,
} from './plot';
export { default as rollRabbitConfig, randomSeed, seedFor } from './rollConfig';
export * from './renderOptions.mjs';
