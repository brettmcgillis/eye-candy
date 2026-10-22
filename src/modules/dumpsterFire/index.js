// The three-free half of DumpsterFireCLI and the scene's Generation
// folders: option schema, roll, the trash / wall / smoke layouts, framing,
// the flame-noise mirror and the plot. The stage it lays out is
// @modules/dumpsterFireRender.
export * from './constants';
export { default as frameDumpster, anglesFor, subjectBounds } from './framing';
export { flameVertex, fractal3, perlin3 } from './noise';
export {
  default as renderDumpsterSvg,
  needsDepth,
  needsImage,
  needsSmokeContrast,
  plotArgs,
  smokeContrast,
} from './plot';
export {
  default as rollDumpsterConfig,
  burnRandom,
  randomSeed,
  seedFor,
} from './rollConfig';
export { composeYaw } from './rotation';
export {
  bendSmokePoints,
  catmullRom,
  flowLines,
  smokeVisibility,
} from './smoke';
export { default as layoutTrash, ASSET_SIZE, TRASH_KEYS } from './trash';
export { default as layoutWall } from './wall';
export * from './renderOptions.mjs';
