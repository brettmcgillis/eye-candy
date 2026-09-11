import { folder } from 'leva';

export default function getFlowControls(p) {
  return folder(
    {
      // Depth held at the upstream rows, which is the discharge: how much
      // water arrives per second follows from this and the gradient, not from
      // a velocity anyone sets.
      inflowDepth: {
        label: 'Inflow Depth',
        value: p.inflowDepth,
        min: 0.05,
        max: 2.5,
        step: 0.01,
      },
      inflowDrive: {
        label: 'Inflow Hold',
        value: p.inflowDrive,
        min: 0,
        max: 1,
        step: 0.01,
      },
      // The weir at the bottom of the frame. Too deep and the reach ponds back
      // upstream; too shallow and it pulls the water off the tail riffle.
      outfallDepth: {
        label: 'Outfall Depth',
        value: p.outfallDepth,
        min: 0.02,
        max: 2,
        step: 0.01,
      },
      outfallDrive: {
        label: 'Outfall Hold',
        value: p.outfallDrive,
        min: 0,
        max: 1,
        step: 0.01,
      },
      surgeAmount: {
        label: 'Surge',
        value: p.surgeAmount,
        min: 0,
        max: 0.8,
        step: 0.01,
      },
      surgePeriod: {
        label: 'Surge Period',
        value: p.surgePeriod,
        min: 2,
        max: 120,
        step: 0.5,
      },
    },
    { collapsed: true }
  );
}
