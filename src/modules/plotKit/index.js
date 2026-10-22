// Three-free plot layers the render workbenches share: framing and
// projection, marching squares, polyline helpers, mesh line work, and the image-driven
// layers (silhouette, shading, Outline rings, texture contours) a plot reads
// from a render and its depth pass's coverage.
export {
  isoSegments,
  maskSegments,
  nearSilhouette,
  pathOf,
  plotLayer,
  silhouetteRuns,
} from './contours';
export { default as frameSphere, framePoints } from './framing';
export { colorRuns, imagePalette, wiggleRuns } from './color';
export { regionFill, rowsWalk, spiralWalk } from './fill';
export { chain, simplify, simplifyLoop, smooth } from './lines';
export {
  chainKeyed,
  meshEdges,
  sectionCuts,
  traceRuns,
  weldMesh,
} from './mesh';
export { default as outlineRuns, outlineOf } from './outline';
export { default as createProjector } from './projector';
export {
  createTone,
  dot as dotPath,
  default as shadePath,
  penPx,
} from './shading';
export { default as textureRuns } from './texture';
