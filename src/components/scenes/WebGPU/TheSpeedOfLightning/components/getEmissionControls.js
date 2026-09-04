import { folder } from 'leva';

export default function getEmissionControls(p) {
  return folder(
    {
      emissiveStrength: {
        label: 'Emissive Strength',
        value: p.emissiveStrength,
        min: 0,
        max: 12,
        step: 0.1,
      },
      tipFalloff: {
        label: 'Tip Falloff',
        value: p.tipFalloff,
        min: 0.02,
        max: 3,
        step: 0.01,
      },
      channelGlow: {
        label: 'Channel Glow',
        value: p.channelGlow,
        min: 0,
        max: 1,
        step: 0.01,
      },
      returnPeak: {
        label: 'Return Peak',
        value: p.returnPeak,
        min: 0,
        max: 6,
        step: 0.05,
      },
      returnSpeedScale: {
        label: 'Return Speed (× leader)',
        value: p.returnSpeedScale,
        min: 1,
        max: 12,
        step: 0.25,
      },
      returnStrokes: {
        label: 'Return Strokes',
        value: p.returnStrokes,
        min: 1,
        max: 6,
        step: 1,
      },
      returnGap: {
        label: 'Stroke Gap',
        value: p.returnGap,
        min: 0,
        max: 1.5,
        step: 0.02,
      },
      returnDecay: {
        label: 'Stroke Decay',
        value: p.returnDecay,
        min: 0.1,
        max: 1,
        step: 0.05,
      },
      returnHold: {
        label: 'Channel Hold',
        value: p.returnHold,
        min: 0,
        max: 4,
        step: 0.05,
      },
      returnHoldDecay: {
        label: 'Hold Decay',
        value: p.returnHoldDecay,
        min: 0.2,
        max: 12,
        step: 0.1,
      },
      returnBranchGlow: {
        label: 'Return On Branches',
        value: p.returnBranchGlow,
        min: 0,
        max: 1,
        step: 0.01,
      },
      returnWidth: {
        label: 'Return Width',
        value: p.returnWidth,
        min: 0.05,
        max: 3,
        step: 0.05,
      },
      ejectaGlow: {
        label: 'Ejecta Glow',
        value: p.ejectaGlow,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
