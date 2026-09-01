import { folder } from 'leva';

export default function getDischargeControls(p) {
  return folder(
    {
      playbackSpeed: {
        label: 'Playback Speed',
        value: p.playbackSpeed,
        min: 0.1,
        max: 2,
        step: 0.05,
      },
      frontSpeed: {
        label: 'Propagation Speed',
        value: p.frontSpeed,
        min: 0.3,
        max: 6,
        step: 0.05,
      },
      holdDuration: {
        label: 'Hold After Strike',
        value: p.holdDuration,
        min: 0,
        max: 4,
        step: 0.1,
      },
      restDuration: {
        label: 'Rest Between Strikes',
        value: p.restDuration,
        min: 0.5,
        max: 8,
        step: 0.1,
      },
      seed: { label: 'Seed', value: p.seed, min: 1, max: 999999, step: 1 },
      strikeVariance: {
        label: 'Strike Variance',
        value: p.strikeVariance,
        min: 0,
        max: 1,
        step: 0.05,
      },
      boltHeight: {
        label: 'Bolt Height',
        value: p.boltHeight,
        min: 2,
        max: 9,
        step: 0.1,
      },
      branchCount: {
        label: 'Branches',
        value: p.branchCount,
        min: 0,
        max: 160,
        step: 1,
      },
      leaderSpread: {
        label: 'Leader Wander',
        value: p.leaderSpread,
        min: 0.2,
        max: 3,
        step: 0.05,
      },
      stepLength: {
        label: 'Accretion Step',
        value: p.stepLength,
        min: 0.006,
        max: 0.05,
        step: 0.001,
      },
      channelDensity: {
        label: 'Channel Density',
        value: p.channelDensity,
        min: 2,
        max: 30,
        step: 1,
      },
      channelRadius: {
        label: 'Channel Radius',
        value: p.channelRadius,
        min: 0.008,
        max: 0.12,
        step: 0.002,
      },
      contactDepth: {
        label: 'Contact Depth (x sand)',
        value: p.contactDepth,
        min: 0,
        max: 1.5,
        step: 0.05,
      },
      emergeArc: {
        label: 'Emerge Distance',
        value: p.emergeArc,
        min: 0.01,
        max: 0.5,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
