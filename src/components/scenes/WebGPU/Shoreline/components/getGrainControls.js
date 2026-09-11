import { folder } from 'leva';

export default function getGrainControls(p) {
  return folder(
    {
      grainCount: {
        label: 'Count',
        value: p.grainCount,
        min: 60000,
        max: 1400000,
        step: 10000,
      },
      waterGrainSize: {
        label: 'Water Size',
        value: p.waterGrainSize,
        min: 0.01,
        max: 0.3,
        step: 0.001,
      },
      rockGrainSize: {
        label: 'Rock Size',
        value: p.rockGrainSize,
        min: 0.02,
        max: 0.6,
        step: 0.002,
      },
      grainSizeMin: {
        label: 'Size Min',
        value: p.grainSizeMin,
        min: 0.1,
        max: 1.5,
        step: 0.01,
      },
      grainSizeMax: {
        label: 'Size Max',
        value: p.grainSizeMax,
        min: 0.2,
        max: 3,
        step: 0.01,
      },
      grainJitter: {
        label: 'Scatter',
        value: p.grainJitter,
        min: 0,
        max: 1.6,
        step: 0.02,
      },
      flowGain: {
        label: 'Flow Follow',
        value: p.flowGain,
        min: 0,
        max: 4,
        step: 0.02,
      },
      grainResponse: {
        label: 'Flow Inertia',
        value: p.grainResponse,
        min: 0.5,
        max: 30,
        step: 0.1,
      },
      // How long a grain rides the flow before it is recycled to its home
      // position. This is the distance the water carries visible material:
      // at 2.5 m/s a five second life is a twelve metre sweep across frame.
      grainLife: {
        label: 'Carry Time',
        value: p.grainLife,
        min: 0.4,
        max: 20,
        step: 0.1,
      },
      grainFade: {
        label: 'Recycle Fade',
        value: p.grainFade,
        min: 0.02,
        max: 0.45,
        step: 0.01,
      },
      grainSettle: {
        label: 'Surface Settle',
        value: p.grainSettle,
        min: 1,
        max: 40,
        step: 0.5,
      },
      churnLift: {
        label: 'Churn Lift',
        value: p.churnLift,
        min: 0,
        max: 1,
        step: 0.005,
      },
      churnRate: {
        label: 'Churn Rate',
        value: p.churnRate,
        min: 0.5,
        max: 20,
        step: 0.1,
      },
      foamLift: {
        label: 'Foam Lift',
        value: p.foamLift,
        min: 0,
        max: 0.8,
        step: 0.005,
      },
      // How long a grain holds foam it has run through. This is what makes a
      // grain's travel legible: without it the grain recolours to whatever
      // cell it is over and the field reads as a screen, not as material.
      // How fast ground that a wave ran over gives up its darkness. This is
      // the whole of what makes a retreating wave visible on the shore.
      shoreDrying: {
        label: 'Drying',
        value: p.shoreDrying,
        min: 0.02,
        max: 6,
        step: 0.01,
      },
      foamMemory: {
        label: 'Foam Release',
        value: p.foamMemory,
        min: 0.05,
        max: 20,
        step: 0.05,
      },
      foamPickup: {
        label: 'Foam Pickup',
        value: p.foamPickup,
        min: 0.5,
        max: 60,
        step: 0.5,
      },
      flowTip: {
        label: 'Flow Tip',
        value: p.flowTip,
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      rockTip: {
        label: 'Rock Tip',
        value: p.rockTip,
        min: 0,
        max: 3,
        step: 0.02,
      },
      tipLimit: {
        label: 'Tip Limit',
        value: p.tipLimit,
        min: 0.05,
        max: 1.6,
        step: 0.01,
      },
      rockJag: {
        label: 'Rock Jag',
        value: p.rockJag,
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      rockDepth: {
        label: 'Rock Packing',
        value: p.rockDepth,
        min: 0,
        max: 1.2,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
