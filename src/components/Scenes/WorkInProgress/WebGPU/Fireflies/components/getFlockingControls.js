import { folder } from 'leva';

export default function getFlockingControls(p) {
  return folder(
    {
      // Floids' Agents.js doesn't expose PROTECTED_RADIUS/VISIBLE_RADIUS as
      // GUI sliders (they're fixed at 0.05/0.15) — these two controls are
      // this scene's own addition beyond Floids, but the values ARE those
      // constants (x WORLD_SCALE) directly, not run through a separate
      // invented conversion factor: default 0.5 = 0.05 x 10, default 1.5 =
      // 0.15 x 10 (see createFloidsSimulation.js).
      separationRadius: {
        label: 'Separation Radius',
        max: 3,
        min: 0.1,
        step: 0.05,
        value: p.separationRadius,
      },
      neighborRadius: {
        label: 'Neighbor Radius',
        max: 8,
        min: 0.5,
        step: 0.1,
        value: p.neighborRadius,
      },
      cursorMode: {
        label: 'Cursor Mode',
        options: { Attract: 'attract', Flee: 'flee', Off: 'off' },
        value: p.cursorMode,
      },
      cursorRadius: {
        label: 'Cursor Radius',
        max: 500,
        min: 50,
        step: 5,
        value: p.cursorRadius,
      },
    },
    { collapsed: true }
  );
}
