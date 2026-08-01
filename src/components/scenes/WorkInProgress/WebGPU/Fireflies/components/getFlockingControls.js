import { button, folder } from 'leva';

// Boid movement: alignment/cohesion/separation/obstacle-avoidance weights
// and radii (boids-js BoidsController), plus the habitat the flock roams in
// (worldSize sizes it; habitatShape picks box or sphere containment, see
// utils/boundaryForce.js) and its spatial-grid resolution. Keys match
// presets/presets.js 1:1 (docs/scene-conventions.md §9). Respawn reseeds
// flock/hunter/obstacle positions from scratch with the current counts.
// fireflyCount's max/default match Floids' Agents.js, which hardcodes 700
// with no control over it at all. gridColor/cellIllumination* style
// GridDebug's static lattice and per-cell occupancy highlight respectively
// — a sphere habitat's occupied cells cluster into a voxelized sphere shape
// on their own, no separate rendering path needed.
export default function getFlockingControls(p, onRespawn) {
  return folder(
    {
      fireflyCount: { value: p.fireflyCount, min: 10, max: 1000, step: 10 },
      worldSize: { value: p.worldSize, min: 10, max: 120, step: 1 },
      subDivisionCount: { value: p.subDivisionCount, min: 2, max: 20, step: 1 },
      habitatShape: {
        value: p.habitatShape,
        options: { Box: 'box', Sphere: 'sphere' },
        label: 'Habitat Shape',
      },
      maxSpeed: { value: p.maxSpeed, min: 1, max: 30, step: 0.5 },
      alignWeight: { value: p.alignWeight, min: 0, max: 5, step: 0.1 },
      cohesionWeight: { value: p.cohesionWeight, min: 0, max: 5, step: 0.1 },
      separationWeight: {
        value: p.separationWeight,
        min: 0,
        max: 5,
        step: 0.1,
      },
      obstacleWeight: { value: p.obstacleWeight, min: 0, max: 10, step: 0.1 },
      boundaryWeight: { value: p.boundaryWeight, min: 0, max: 10, step: 0.1 },
      neighborRadius: { value: p.neighborRadius, min: 1, max: 20, step: 0.5 },
      separationRadius: {
        value: p.separationRadius,
        min: 0.5,
        max: 10,
        step: 0.25,
      },
      obstacleMargin: {
        value: p.obstacleMargin,
        min: 0.5,
        max: 10,
        step: 0.25,
      },
      boundaryMargin: { value: p.boundaryMargin, min: 1, max: 20, step: 0.5 },
      showGrid: { value: p.showGrid, label: 'Show Grid (debug)' },
      gridColor: { value: p.gridColor, label: 'Grid Color' },
      cellIlluminationEnabled: {
        value: p.cellIlluminationEnabled,
        label: 'Illuminate Cells On Occupancy',
      },
      cellIlluminationColor: {
        value: p.cellIlluminationColor,
        label: 'Cell Illumination Color',
      },
      respawn: button(() => onRespawn()),
    },
    { collapsed: true }
  );
}
