import { button, folder } from 'leva';

export default function getFluidControls(p, onRespawn, onEnableTilt) {
  return folder(
    {
      // Tilt gravity for the single-tab mobile scenario: the toggle gates
      // whether the sim reads the device-orientation gravity vector; the
      // button exists because iOS only grants motion access from inside a
      // click handler (it flips the toggle on once granted).
      tiltGravity: { label: 'Tilt Gravity (mobile)', value: p.tiltGravity },
      enableTilt: button(() => onEnableTilt()),
      gravity: {
        label: 'Gravity (px/s²)',
        max: 4000,
        min: 200,
        step: 50,
        value: p.gravity,
      },
      maxParticles: {
        label: 'Particle Count',
        max: 3000,
        min: 200,
        step: 50,
        value: p.maxParticles,
      },
      particleRadius: {
        label: 'Particle Radius (px)',
        max: 12,
        min: 2,
        step: 0.5,
        value: p.particleRadius,
      },
      particleColor: { label: 'Color', value: p.particleColor },
      flipRatio: {
        label: 'FLIP Ratio',
        max: 1,
        min: 0,
        step: 0.05,
        value: p.flipRatio,
      },
      pressureIters: {
        label: 'Pressure Iterations',
        max: 100,
        min: 10,
        step: 5,
        value: p.pressureIters,
      },
      particleIters: {
        label: 'Separation Iterations',
        max: 6,
        min: 0,
        step: 1,
        value: p.particleIters,
      },
      overRelaxation: {
        label: 'Over-Relaxation',
        max: 2,
        min: 1,
        step: 0.05,
        value: p.overRelaxation,
      },
      compensateDrift: { label: 'Compensate Drift', value: p.compensateDrift },
      separateParticles: {
        label: 'Separate Particles',
        value: p.separateParticles,
      },
      worldWidth: {
        label: 'World Width (px)',
        max: 6000,
        min: 800,
        step: 100,
        value: p.worldWidth,
      },
      worldHeight: {
        label: 'World Height (px)',
        max: 4000,
        min: 600,
        step: 100,
        value: p.worldHeight,
      },
      Whitewater: folder(
        {
          whitewaterEnabled: { label: 'Enabled', value: p.whitewaterEnabled },
          maxDiffuseParticles: {
            label: 'Max Particles',
            max: 12000,
            min: 500,
            step: 250,
            value: p.maxDiffuseParticles,
          },
          diffuseEmissionRate: {
            label: 'Emission Rate',
            max: 30,
            min: 0,
            step: 0.5,
            value: p.diffuseEmissionRate,
          },
          diffuseMinSpeed: {
            label: 'Min Speed (px/s)',
            max: 1200,
            min: 0,
            step: 10,
            value: p.diffuseMinSpeed,
          },
          diffuseLifetime: {
            label: 'Lifetime (s)',
            max: 6,
            min: 0.2,
            step: 0.1,
            value: p.diffuseLifetime,
          },
          bubbleBuoyancy: {
            label: 'Bubble Buoyancy',
            max: 10,
            min: 0,
            step: 0.25,
            value: p.bubbleBuoyancy,
          },
          diffuseSize: {
            label: 'Particle Size (px)',
            max: 10,
            min: 1,
            step: 0.5,
            value: p.diffuseSize,
          },
          foamColor: { label: 'Foam Color', value: p.foamColor },
          sprayColor: { label: 'Spray Color', value: p.sprayColor },
          bubbleColor: { label: 'Bubble Color', value: p.bubbleColor },
        },
        { collapsed: true }
      ),
      respawn: button(() => onRespawn()),
    },
    { collapsed: true }
  );
}
