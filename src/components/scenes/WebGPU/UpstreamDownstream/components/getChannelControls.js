import { folder } from 'leva';

// Everything here rebakes the reach and relays the grains. The rebake
// re-solves the bed under the water that is already running rather than
// reflooding it, so a change costs a hitch rather than the flow -- which is
// why presets are free to move these.
export default function getChannelControls(p) {
  return folder(
    {
      streamSeed: {
        label: 'Seed',
        value: p.streamSeed,
        min: 0,
        max: 400,
        step: 1,
      },
      // Fall per metre down the reach. This is the single strongest control on
      // the whole scene: it is what the water runs down, so it sets the speed,
      // the Froude number and therefore where the reach breaks white.
      gradient: {
        label: 'Gradient',
        value: p.gradient,
        min: 0.002,
        max: 0.14,
        step: 0.001,
      },
      channelWidth: {
        label: 'Channel Width',
        value: p.channelWidth,
        min: 2,
        max: 22,
        step: 0.2,
      },
      thalweg: {
        label: 'Channel Depth',
        value: p.thalweg,
        min: 0,
        max: 2.5,
        step: 0.02,
      },
      meander: {
        label: 'Meander',
        value: p.meander,
        min: 0,
        max: 10,
        step: 0.1,
      },
      meanderRate: {
        label: 'Meander Rate',
        value: p.meanderRate,
        min: 0.2,
        max: 4,
        step: 0.05,
      },
      riffleRelief: {
        label: 'Riffle Relief',
        value: p.riffleRelief,
        min: 0,
        max: 1.2,
        step: 0.01,
      },
      riffleRate: {
        label: 'Riffle Rate',
        value: p.riffleRate,
        min: 0.5,
        max: 12,
        step: 0.1,
      },
      restDepth: {
        label: 'Rest Depth',
        value: p.restDepth,
        min: 0.05,
        max: 2,
        step: 0.01,
      },
      bankHeight: {
        label: 'Bank Height',
        value: p.bankHeight,
        min: 0.1,
        max: 5,
        step: 0.05,
      },
      bankSlope: {
        label: 'Bank Run',
        value: p.bankSlope,
        min: 0.5,
        max: 14,
        step: 0.1,
      },
      bankRelief: {
        label: 'Bank Relief',
        value: p.bankRelief,
        min: 0,
        max: 3,
        step: 0.02,
      },
      bedRelief: {
        label: 'Gravel Relief',
        value: p.bedRelief,
        min: 0,
        max: 0.8,
        step: 0.005,
      },
      boulderCount: {
        label: 'Boulders',
        value: p.boulderCount,
        min: 0,
        max: 60,
        step: 1,
      },
      boulderSize: {
        label: 'Boulder Size',
        value: p.boulderSize,
        min: 0.2,
        max: 4,
        step: 0.05,
      },
      cobbleCount: {
        label: 'Cobbles',
        value: p.cobbleCount,
        min: 0,
        max: 900,
        step: 5,
      },
      cobbleSize: {
        label: 'Cobble Size',
        value: p.cobbleSize,
        min: 0.2,
        max: 4,
        step: 0.05,
      },
      waterline: {
        label: 'Waterline',
        value: p.waterline,
        min: -1.5,
        max: 1.5,
        step: 0.01,
      },
      roleFeather: {
        label: 'Waterline Dither',
        value: p.roleFeather,
        min: 0,
        max: 1.5,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
