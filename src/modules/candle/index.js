// The three-free half of CandleCLI and the Burning At Both Ends scene:
// option schema, roll, the wax form and mesh, flame states and their
// signal, placement, framing and the plot. The stage is @modules/candleRender.
export {
  EMBER_STATE_PARAMS,
  FLAME_STATE_PARAMS,
  emberGlow,
  flameParams,
  flameSignal,
  isLit,
  noise1,
  smokeAmount,
} from './flameStates';
export {
  default as frameCandle,
  candleBounds,
  candleToWorld,
  mirrorEnd,
} from './framing';
export { default as candlePlacement } from './placement';
export {
  default as renderCandleSvg,
  needsAlbedo,
  needsDepth,
  needsImage,
  plotArgs,
} from './plot';
export {
  default as rollCandleConfig,
  burnRandom,
  randomSeed,
  seedFor,
} from './rollConfig';
export {
  buildWax,
  candleDistance,
  candleForm,
  flameCentre,
  maxBodyRadius,
} from './wax';
export * from './renderOptions.mjs';
