import { folder } from 'leva';

import { VOICE_NAMES } from '../../utils/audio/voices';

export const DEFAULTS = {
  dropRate: 1.1,
  rippleColor: '#6fc8ff',
  rippleRadius: 58,
  rippleSpan: 15,
  rippleVoiceA: 'bell',
  rippleVoiceB: 'marimba',
  rippleVoiceC: 'pad',
  ringGap: 1.6,
  sparkColor: '#fff4c2',
  velocityMax: 0.95,
  velocityMin: 0.2,
  waveSpeed: 15,
};

export default function getRippleControls(p, render) {
  return folder(
    {
      rippleHint: { editable: false, label: 'Play', value: 'click to drop' },
      dropRate: {
        label: 'Rain / sec',
        max: 8,
        min: 0,
        step: 0.1,
        value: p.dropRate,
      },
      waveSpeed: {
        label: 'Wave Speed',
        max: 40,
        min: 4,
        step: 0.5,
        value: p.waveSpeed,
      },
      rippleRadius: {
        label: 'Ripple Reach',
        max: 120,
        min: 20,
        step: 1,
        value: p.rippleRadius,
      },
      ringGap: {
        label: 'Ring Gap',
        max: 4,
        min: 0.6,
        step: 0.1,
        value: p.ringGap,
      },
      rippleSpan: {
        label: 'Pitch Span (degrees)',
        max: 28,
        min: 3,
        step: 1,
        value: p.rippleSpan,
      },
      velocityMin: {
        label: 'Min Velocity',
        max: 1,
        min: 0.05,
        step: 0.01,
        value: p.velocityMin,
      },
      velocityMax: {
        label: 'Max Velocity',
        max: 1,
        min: 0.05,
        step: 0.01,
        value: p.velocityMax,
      },
      rippleVoiceA: {
        label: 'Voice A',
        options: VOICE_NAMES,
        value: p.rippleVoiceA,
      },
      rippleVoiceB: {
        label: 'Voice B',
        options: VOICE_NAMES,
        value: p.rippleVoiceB,
      },
      rippleVoiceC: {
        label: 'Voice C',
        options: VOICE_NAMES,
        value: p.rippleVoiceC,
      },
      rippleColor: { label: 'Ripple Color', value: p.rippleColor },
      sparkColor: { label: 'Spark Color', value: p.sparkColor },
    },
    { collapsed: true, render }
  );
}
