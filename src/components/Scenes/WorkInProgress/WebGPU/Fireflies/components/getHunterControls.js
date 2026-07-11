import { folder } from 'leva';

export default function getHunterControls(p) {
  return folder(
    {
      hunterCount: {
        label: 'Per Window',
        max: 3,
        min: 0,
        step: 1,
        value: p.hunterCount,
      },
      // This control IS Hunter.js's own DESIRED_SPEED (0.25 default,
      // ~/dev/examples/Floids/src/world/Hunter.js), scaled by WORLD_SCALE
      // in hooks/useSharedSwarm.js — not a separate invented multiplier.
      // Floids doesn't expose it as a GUI slider (it's fixed); range here
      // is just headroom around that literal default.
      hunterSpeed: {
        label: 'Speed',
        max: 0.6,
        min: 0.05,
        step: 0.01,
        value: p.hunterSpeed,
      },
      // Purely this scene's own rendered sphere size — Floids' hunter is a
      // fixed-size wireframe cone (radius 0.04), no equivalent control.
      // Deliberately NOT used to derive the flee-trigger distance (see
      // FLEE_RADIUS in createFloidsSimulation.js) — those are unrelated in
      // Floids and conflating them was a bug in the original port.
      hunterRadius: {
        label: 'Radius',
        max: 60,
        min: 8,
        step: 1,
        value: p.hunterRadius,
      },
    },
    { collapsed: true }
  );
}
