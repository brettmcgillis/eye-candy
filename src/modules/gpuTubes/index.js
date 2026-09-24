// Lit GPU tubes, after Mathis Biabiany's "Drawing With Light" (Codrops, 2026):
// a grid of (progress, angle) parameters shaped entirely in positionNode from a
// curve function, riding on an ordinary PBR node material. Plus the authoring
// half of the same piece: strands described by walking a mesh's surface graph
// along a geodesic field, not by decorating it.
export { default as createCurveSampler } from './curveSampler';
export { default as createTubeGeometry } from './tubeGeometry';
export { default as createTubeMaterial } from './tubeMaterial';
export { FRAME_MODES } from './tubeFrame';
export { default as buildSurfaceGraph } from './strands/surfaceGraph';
export { default as geodesicField, fieldMaxima } from './strands/geodesic';
export { default as packStrands } from './strands/packStrands';
export { default as createSpatialHash } from './strands/spatialHash';
export { default as createMinHeap } from './strands/minHeap';
export { resamplePolyline, smoothPolyline } from './strands/polyline';
export { walkFlowStrands, walkWanderStrands } from './strands/walkStrands';
