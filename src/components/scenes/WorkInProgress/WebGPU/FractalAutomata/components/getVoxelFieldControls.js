import { folder } from 'leva';

// Voxel-field / CA controls, keys 1:1 with presets/presets.js (docs/scene-
// conventions.md §9). `level` drives grid resolution (k = 2^level + 1) —
// instance count is k^3, so each level roughly doubles it (level 6→7 alone
// is a ~7.8x jump, from 274,625 to 2,146,689 instances). Default preset
// matches ~/dev/examples/260708_AutomataChunks's own default (level 7) — max
// is capped there rather than higher given the shadow-casting instance cost.
export default function getVoxelFieldControls(p = {}) {
  return folder(
    {
      level: {
        label: 'Level (detail)',
        value: p.level ?? 7,
        min: 3,
        max: 7,
        step: 1,
      },
      seed: {
        label: 'Seed',
        value: p.seed ?? 260708,
        min: 0,
        max: 999999,
        step: 1,
      },
      baseFill: {
        label: 'Base Fill',
        value: p.baseFill ?? 'random',
        options: ['random', 'state1', 'state2', 'state3', 'split'],
      },
      ruleMode: {
        label: 'Rule Mode',
        value: p.ruleMode ?? 'random',
        options: ['random', 'ising', 'balanced'],
      },
      density: {
        label: 'Density',
        value: p.density ?? 0.34,
        min: 0,
        max: 1,
        step: 0.01,
      },
      beta: {
        label: 'Beta (ising)',
        value: p.beta ?? 0.56,
        min: 0,
        max: 3,
        step: 0.01,
      },
      magnetism: {
        label: 'Magnetism',
        value: p.magnetism ?? 0.1,
        min: -2,
        max: 2,
        step: 0.01,
      },
      flipChance: {
        label: 'Flip Chance',
        value: p.flipChance ?? 0.02,
        min: 0,
        max: 0.5,
        step: 0.005,
      },
      removeStrays: { label: 'Remove Strays', value: p.removeStrays ?? true },
      cellSpacing: {
        label: 'Cell Spacing',
        value: p.cellSpacing ?? 0.6,
        min: 0.1,
        max: 3,
        step: 0.01,
      },
      cellScale: {
        label: 'Cell Scale',
        value: p.cellScale ?? 0.6,
        min: 0.05,
        max: 1,
        step: 0.01,
      },
      // Default off — instant resolve is the point (fast seed/setting
      // iteration). The timed reveal algorithm itself needs rework (uneven,
      // not read as organic) before it's worth re-enabling by default.
      growthEnabled: {
        label: 'Growth Enabled',
        value: p.growthEnabled ?? false,
      },
      growthDurationSeconds: {
        label: 'Growth Duration (s)',
        value: p.growthDurationSeconds ?? 14,
        min: 1,
        max: 60,
        step: 0.5,
      },
      growthJitter: {
        label: 'Growth Jitter',
        value: p.growthJitter ?? 0.8,
        min: 0,
        max: 1,
        step: 0.01,
      },
      // Render-time distance-from-center cutoff (live-tunable, no
      // regenerate) — the structure itself still generates/grows across the
      // full cube; 'sphere' just hides cells beyond boundsSphereRadius (in
      // half-cube-widths) at draw time. 1.0 is the sphere inscribed in the
      // cube (touches each face's center, cuts the corners); >1 grows toward
      // the cube's corners (circumscribed at sqrt(3) ≈ 1.73).
      boundsShape: {
        label: 'Bounds Shape',
        value: p.boundsShape ?? 'cube',
        options: ['cube', 'sphere'],
      },
      boundsSphereRadius: {
        label: 'Sphere Radius',
        value: p.boundsSphereRadius ?? 1.0,
        min: 0.1,
        max: 1.75,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
