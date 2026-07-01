import { folder } from 'leva';

const gravity = (label, value) => ({
  label,
  value,
  min: -0.6,
  max: 0.6,
  step: 0.01,
});

export default function getSimulationControls(snapshot) {
  return folder(
    {
      runSimulation: { label: 'Run', value: snapshot.runSimulation },
      particles: {
        label: 'Particles',
        value: snapshot.particles,
        min: 4096,
        max: snapshot.maxParticles,
        step: 4096,
      },
      maxParticles: {
        label: 'Max Particles',
        value: snapshot.maxParticles,
        min: 8192 * 4,
        max: 8192 * 16,
        step: 4096,
      },
      particleSize: {
        label: 'Particle Size',
        value: snapshot.particleSize,
        min: 0.5,
        max: 2.25,
        step: 0.05,
      },
      speed: {
        label: 'Speed',
        value: snapshot.speed,
        min: 0.1,
        max: 2,
        step: 0.1,
      },
      noise: {
        label: 'Noise',
        value: snapshot.noise,
        min: 0,
        max: 2,
        step: 0.01,
      },
      stiffness: {
        label: 'Stiffness',
        value: snapshot.stiffness,
        min: 0.5,
        max: 8,
        step: 0.1,
      },
      restDensity: {
        label: 'Rest Density',
        value: snapshot.restDensity,
        min: 0.4,
        max: 2.5,
        step: 0.05,
      },
      dynamicViscosity: {
        label: 'Viscosity',
        value: snapshot.dynamicViscosity,
        min: 0.01,
        max: 0.4,
        step: 0.01,
      },
      gravityX: gravity('Gravity X', snapshot.gravityX),
      gravityY: gravity('Gravity Y', snapshot.gravityY),
      gravityZ: gravity('Gravity Z', snapshot.gravityZ),
      bloom: { label: 'Bloom', value: snapshot.bloom },
    },
    { collapsed: true }
  );
}
