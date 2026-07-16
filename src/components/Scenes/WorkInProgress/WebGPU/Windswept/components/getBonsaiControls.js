import { folder } from 'leva';

// Bonsai centerpiece controls. Keys match presets/presets.js 1:1
// (docs/scene-conventions.md §9). Pot/bud/stalk/flower default hidden per
// todo.md — the bare soil/bark/branch/knot read as a windswept craggly tree
// the leaf/sakura swarm flows around; the hidden parts stay toggleable since
// elements/Bonsai.jsx supports them generically.
export default function getBonsaiControls(p = {}) {
  return folder({
    bonsaiVisible: { label: 'Visible', value: p.bonsaiVisible ?? true },
    bonsaiPosition: {
      label: 'Position',
      step: 0.1,
      value: p.bonsaiPosition ?? { x: 0, y: 0, z: 0 },
    },
    bonsaiScale: {
      label: 'Scale',
      value: p.bonsaiScale ?? 1,
      min: 0.2,
      max: 20,
      step: 0.05,
    },
    bonsaiRotationY: {
      label: 'Rotation Y',
      value: p.bonsaiRotationY ?? 0,
      min: 0,
      max: 360,
      step: 1,
    },
    bonsaiShowPot: { label: 'Show Pot', value: p.bonsaiShowPot ?? false },
    bonsaiShowStalk: {
      label: 'Show Stalk',
      value: p.bonsaiShowStalk ?? false,
    },
    bonsaiShowBud: { label: 'Show Bud', value: p.bonsaiShowBud ?? false },
    bonsaiShowFlower: {
      label: 'Show Flower',
      value: p.bonsaiShowFlower ?? false,
    },
  });
}
