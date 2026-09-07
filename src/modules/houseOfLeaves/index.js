// Shared architecture for the House of Leaves constellation. Scenes never
// import from one another, so the pieces the toolbox authors live here and are
// consumed by both the toolbox and the scenes themselves.
export {
  default as createStairSegment,
  stairSegmentSpan,
  STAIR_SEGMENT_DEFAULTS,
} from './geometry/stairSegment';
export { default as createLanding, LANDING_DEFAULTS } from './geometry/landing';
export {
  default as createHallway,
  hallwaySection,
  hallwaySideDoor,
  hallwaySpringLine,
  HALLWAY_DEFAULTS,
} from './geometry/hallway';
export {
  default as createShaftMouthRoom,
  SHAFT_MOUTH_DEFAULTS,
} from './geometry/shaftMouthRoom';
export {
  default as createShaftFloor,
  shaftFloorDoorways,
  SHAFT_FLOOR_DEFAULTS,
} from './geometry/shaftFloor';
export {
  default as createThreshold,
  THRESHOLD_DEFAULTS,
} from './geometry/threshold';
export { default as createRoom, ROOM_DEFAULTS } from './geometry/room';
export {
  default as createWallSegment,
  openingAngularWidth,
  wallOpeningInset,
  WALL_SEGMENT_DEFAULTS,
} from './geometry/wallSegment';
export {
  archHeightAt,
  archProfile,
  orientInward,
} from './geometry/geometryUtils';
export {
  default as createStoneMaterial,
  STONE_DEFAULTS,
} from './materials/stone';
export { default as Flare } from './components/Flare';
export { FBM3_MAX_SLOPE, fbm1, hash01 } from './profile/noise';
export {
  CORRIDOR_DEFAULTS,
  CORRIDOR_VARIATIONS,
  corridorVariationFor,
  openingScaleFor,
  sectionAt,
  segmentAt,
  stepScaleFor,
} from './profile/corridor';
export {
  FEET,
  SHAFT_DEFAULTS,
  advanceRise,
  angleAt,
  angleRateAt,
  axisAt,
  landingAt,
  landingPosition,
  landingsInRange,
  plateauBefore,
  riseAt,
  rotateXZ,
  voidRadiusAt,
} from './profile/shaft';
export {
  default as createSurfaceMaterial,
  SURFACE_DEFAULTS,
  SURFACE_MAPS,
  SURFACE_SETS,
  setSurfaceFrame,
} from './materials/surface';
