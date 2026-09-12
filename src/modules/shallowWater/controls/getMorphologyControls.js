import { folder } from 'leva';

// The bed answering the water back. Off by default: a scene that is reshaping
// itself is not the scene the preset was tuned as, and the terrain controls
// stop being the last word on the shape of the place once this is running.
export default function getMorphologyControls(p) {
  return folder(
    {
      morphologyEnabled: { label: 'Reshape', value: p.morphologyEnabled },
      bedCarry: {
        label: 'Carry',
        value: p.bedCarry,
        min: 0,
        max: 4,
        step: 0.02,
      },
      bedErode: {
        label: 'Scour Rate',
        value: p.bedErode,
        min: 0,
        max: 2,
        step: 0.005,
      },
      bedDeposit: {
        label: 'Drop Rate',
        value: p.bedDeposit,
        min: 0,
        max: 4,
        step: 0.02,
      },
      // How much of the bake's facet noise is read as hard rock. At zero the
      // ground wears evenly; pushed up, a headland wears into ribs.
      bedResist: {
        label: 'Hardness',
        value: p.bedResist,
        min: 0,
        max: 1,
        step: 0.01,
      },
      // Where the capacity stops caring about depth. Under this the water is
      // thin and fast over a bar and carries everything; well over it the
      // column is a pool and drops what it holds.
      carryDepth: {
        label: 'Carry Depth',
        value: p.carryDepth,
        min: 0.05,
        max: 4,
        step: 0.05,
      },
      bedLimit: {
        label: 'Change Limit',
        value: p.bedLimit,
        min: 0.002,
        max: 0.5,
        step: 0.002,
      },
    },
    { collapsed: true }
  );
}
