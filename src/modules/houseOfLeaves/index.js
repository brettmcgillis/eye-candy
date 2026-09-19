// Shared architecture for House of Leaves: the profiles that describe the
// labyrinth and the builders that turn them into inward-facing surfaces.
export {
  KEEP,
  boxAir,
  buildAir,
  finishAir,
  loftAir,
  mergeAir,
  prismAir,
  tagFaces,
  unionAir,
} from './geometry/air';
export {
  createJointWall,
  createSideWall,
  createSlab,
  createWall,
  framePieces,
} from './geometry/frame';
export {
  default as createCorridorUnit,
  CORRIDOR_UNIT_DEFAULTS,
} from './geometry/corridorUnit';
export {
  default as createGreatRoom,
  GREAT_ROOM_DEFAULTS,
} from './geometry/greatRoom';
export {
  default as createShaftFloor,
  shaftFloorDoorways,
  SHAFT_FLOOR_DEFAULTS,
} from './geometry/shaftFloor';
export { default as createMouthPatch } from './geometry/mouthPatch';
export {
  default as createLivingRoom,
  LIVING_ROOM_DEFAULTS,
} from './geometry/livingRoom';
export {
  default as createStairSegment,
  stairSegmentSpan,
  STAIR_SEGMENT_DEFAULTS,
} from './geometry/stairSegment';
export { default as createLanding, LANDING_DEFAULTS } from './geometry/landing';
export { default as Flare } from './components/Flare';
export { FBM3_MAX_SLOPE, fbm1, hash01 } from './profile/noise';
export {
  CORRIDOR_DEFAULTS,
  CORRIDOR_VARIATIONS,
  corridorVariationFor,
  growthAt,
  openingScaleFor,
  sectionAt,
  segmentAt,
  stepScaleFor,
} from './profile/corridor';
export {
  FEET,
  SHAFT_DEFAULTS,
  advanceRise,
  allLandings,
  angleAt,
  angleRateAt,
  axisAt,
  landingAt,
  landingPosition,
  landingsInRange,
  landingsUpTo,
  plateauBefore,
  riseAt,
  riseTo,
  rotateXZ,
  uAtRise,
  voidRadiusAt,
  wallRadiusAt,
} from './profile/shaft';
export {
  default as createSurfaceMaterial,
  SURFACE_DEFAULTS,
  SURFACE_MAPS,
  SURFACE_SETS,
  setSurfaceFrame,
} from './materials/surface';
