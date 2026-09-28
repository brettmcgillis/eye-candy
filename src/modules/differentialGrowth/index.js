// Differential growth after 260316_DifferentialLayers: closed curves that grow,
// buckle and fold under springs, repulsion and splitting. The engine only ever
// moves points through a `project(point, normal)` callback, so the same curve
// runs on a mesh surface (createSurfaceProjector) or on a plane the caller
// bounds itself.
export { default as SurfaceGrowthEngine } from './engine';
export { default as createSurfaceProjector } from './surfaceProjector';
export { default as seedLoop } from './seedLoop';
