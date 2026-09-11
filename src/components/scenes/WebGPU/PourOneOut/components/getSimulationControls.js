import { folder } from 'leva';

import { MAX_PARTICLES } from '../utils/domain';

export default function getSimulationControls(p) {
  return folder(
    {
      runSimulation: { label: 'Run', value: p.runSimulation },
      particles: {
        label: 'Particles',
        value: p.particles,
        min: 4096,
        max: MAX_PARTICLES,
        step: 4096,
      },
      speed: { label: 'Speed', value: p.speed, min: 0.1, max: 2, step: 0.05 },
      // Cells per second squared, not metres: the solver works in grid space.
      gravity: {
        label: 'Gravity',
        value: p.gravity,
        min: 0,
        max: 260,
        step: 1,
      },
      // 0 is pure PIC, smooth and damped; 1 is pure FLIP, energetic and
      // wispy. This is the knob between syrup and smoke.
      fluidity: {
        label: 'Fluidity (PIC/FLIP)',
        value: p.fluidity,
        min: 0,
        max: 1,
        step: 0.005,
      },
      turbulence: {
        label: 'Turbulence',
        value: p.turbulence,
        min: 0,
        max: 0.5,
        step: 0.005,
      },
      // Red-black Gauss-Seidel sweeps on the pressure Poisson equation. More
      // sweeps means a more nearly divergence-free field: measured mean
      // residual 0.64 at 4, 0.29 at 20, 0.06 at 40.
      pressureIterations: {
        label: 'Pressure Iterations',
        value: p.pressureIterations,
        min: 2,
        max: 48,
        step: 2,
      },
      targetDensity: {
        label: 'Target Density',
        value: p.targetDensity,
        min: 0.5,
        max: 10,
        step: 0.1,
      },
      densityCorrection: {
        label: 'Anti-clump',
        value: p.densityCorrection,
        min: 0,
        max: 4,
        step: 0.05,
      },
      Pour: folder(
        {
          // The source is a ball of fluid that particles fall out of under
          // gravity, not a nozzle firing them: speed is a nudge, not a jet.
          sourceRadius: {
            label: 'Source Radius',
            value: p.sourceRadius,
            min: 0.5,
            max: 12,
            step: 0.1,
          },
          // Zero by design: fluid should fall out of the ball under gravity,
          // not be launched out of it.
          sourceSpeed: {
            label: 'Drop Speed',
            value: p.sourceSpeed,
            min: 0,
            max: 12,
            step: 0.1,
          },
          // Sets how much of the budget is airborne at once, which is what
          // makes the source read as a dense ball and the fall read as fluid
          // rather than as scattered popcorn. Self-limiting: only particles
          // already in the pool are eligible, so the pool cannot be drained
          // past what the fall returns.
          pourRate: {
            label: 'Pour Rate (/s)',
            value: p.pourRate,
            min: 100,
            max: 40000,
            step: 100,
          },
          sourceHeight: {
            label: 'Height',
            value: p.sourceHeight,
            min: 32,
            max: 61,
            step: 0.5,
          },
          sourceOrbitRadius: {
            label: 'Orbit Radius',
            value: p.sourceOrbitRadius,
            min: 0,
            max: 26,
            step: 0.5,
          },
          sourceOrbitSpeed: {
            label: 'Orbit Speed (rev/s)',
            value: p.sourceOrbitSpeed,
            min: -0.5,
            max: 0.5,
            step: 0.005,
          },
          sourceOrbitBob: {
            label: 'Orbit Bob',
            value: p.sourceOrbitBob,
            min: 0,
            max: 12,
            step: 0.25,
          },
          sourceOffsetX: {
            label: 'Centre X',
            value: p.sourceOffsetX,
            min: -16,
            max: 16,
            step: 0.5,
          },
          sourceOffsetZ: {
            label: 'Centre Z',
            value: p.sourceOffsetZ,
            min: -16,
            max: 16,
            step: 0.5,
          },
          // Only fluid that has drained below this line is eligible to return.
          drainHeight: {
            label: 'Drain Line',
            value: p.drainHeight,
            min: 3,
            max: 30,
            step: 0.5,
          },
          // Normalises the age that drives the heat ramp; not a lifetime.
          maxAge: {
            label: 'Heat Ramp (s)',
            value: p.maxAge,
            min: 1,
            max: 90,
            step: 0.5,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
