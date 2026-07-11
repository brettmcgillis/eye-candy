import { folder } from 'leva';

export default function getFireflyControls(p) {
  return folder(
    {
      fireflyCount: {
        label: 'Count',
        max: 1000,
        min: 40,
        step: 1,
        value: p.fireflyCount,
      },
      fireflySize: {
        label: 'Body Size',
        max: 12,
        min: 2,
        step: 0.1,
        value: p.fireflySize,
      },
      fireflyGlow: {
        label: 'Glow Scale',
        max: 6,
        min: 0.5,
        step: 0.1,
        value: p.fireflyGlow,
      },
      // Range/step mirror Floids' own dat.gui slider for DESIRED_SPEED
      // (~/dev/examples/Floids/src/world/World.js) — this control IS that
      // value, scaled by WORLD_SCALE in createFloidsSimulation.js, not run
      // through a separate invented conversion factor.
      fireflySpeed: {
        label: 'Speed',
        max: 0.4,
        min: 0,
        step: 0.05,
        value: p.fireflySpeed,
      },
      fireCycle: {
        label: 'Flash Cycle',
        max: 6,
        min: 0.5,
        step: 0.1,
        value: p.fireCycle,
      },
      lightIntensity: {
        label: 'Light Intensity',
        max: 20,
        min: 0,
        step: 0.1,
        value: p.lightIntensity,
      },
    },
    { collapsed: true }
  );
}
