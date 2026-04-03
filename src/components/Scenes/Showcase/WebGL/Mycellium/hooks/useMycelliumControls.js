import { folder, useControls } from 'leva';

const SIM_SCHEMA = {
  temperature: { min: 0, max: 3, step: 0.01 },
  equilibrium: { min: 0.3, max: 5, step: 0.05 },
  coherence: { min: 0.3, max: 4, step: 0.05 },
  scaleDepth: { label: 'Scale Depth', min: 0.01, max: 2, step: 0.01 },
  freeEnergy: { label: 'Free Energy', min: 0, max: 3, step: 0.01 },
  boundRadius: { label: 'Bound Radius', min: 2, max: 10, step: 0.5 },
  viscosity: { min: 0, max: 0.15, step: 0.001 },
  mass: { min: 0.1, max: 5, step: 0.1 },
  maxSpeed: { label: 'Max Speed', min: 0.5, max: 10, step: 0.1 },
  halfLife: { label: 'Half Life', min: 0.9, max: 1, step: 0.001 },
};

export default function useMycelliumControls(label, defaults) {
  return useControls(
    label,
    () => ({
      Simulation: folder(
        Object.fromEntries(
          Object.entries(SIM_SCHEMA).map(([key, schema]) => [
            key,
            { value: defaults[key], ...schema },
          ])
        ),
        { collapsed: true }
      ),
      Styling: folder(
        {
          color1: { label: 'Core Color', value: defaults.color1 },
          color2: { label: 'Mid Color', value: defaults.color2 },
          color3: { label: 'Edge Color', value: defaults.color3 },
          pointSize: {
            label: 'Point Size',
            value: defaults.pointSize,
            min: 0.01,
            max: 0.2,
            step: 0.001,
          },
          opacity: { value: defaults.opacity, min: 0.05, max: 1.0, step: 0.01 },
        },
        { collapsed: true }
      ),
      Behavior: folder(
        {
          autoEvolve: { label: 'Auto Evolve', value: defaults.autoEvolve },
          glitchEnabled: { label: 'Glitch', value: defaults.glitchEnabled },
          pointCount: {
            label: 'Point Count',
            value: defaults.pointCount,
            min: 10000,
            max: 300000,
            step: 5000,
          },
        },
        { collapsed: true }
      ),
      Position: folder(
        {
          offsetX: {
            label: 'X',
            value: defaults.offsetX,
            min: -30,
            max: 30,
            step: 0.5,
          },
          offsetY: {
            label: 'Y',
            value: defaults.offsetY,
            min: -30,
            max: 30,
            step: 0.5,
          },
          offsetZ: {
            label: 'Z',
            value: defaults.offsetZ,
            min: -30,
            max: 30,
            step: 0.5,
          },
          orbit: { label: 'Orbit', value: defaults.orbit },
          orbitRadius: {
            label: 'Radius',
            value: defaults.orbitRadius,
            min: 0,
            max: 20,
            step: 0.5,
          },
          orbitSpeed: {
            label: 'Speed',
            value: defaults.orbitSpeed,
            min: 0,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );
}
