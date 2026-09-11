import { folder } from 'leva';

export default function getFoamControls(p) {
  return folder(
    {
      foamBirth: {
        label: 'Birth',
        value: p.foamBirth,
        min: 0,
        max: 8,
        step: 0.05,
      },
      foamDecay: {
        label: 'Decay',
        value: p.foamDecay,
        min: 0.02,
        max: 3,
        step: 0.01,
      },
      foamAdvect: {
        label: 'Carry',
        value: p.foamAdvect,
        min: 0,
        max: 3,
        step: 0.02,
      },
      // The reaction term is what separates lace from a blurred mask: it
      // pushes every cell away from its neighbourhood average, so fronts
      // sharpen and holes open instead of the field relaxing flat. Per
      // second, so the pattern does not change with the substep count.
      foamReaction: {
        label: 'Reaction',
        value: p.foamReaction,
        min: 0,
        max: 80,
        step: 0.5,
      },
      // Smooths at the texel scale before the reaction runs. Without it the
      // reaction finds grid noise and amplifies that instead of the lace.
      foamSmooth: {
        label: 'Smoothing',
        value: p.foamSmooth,
        min: 0,
        max: 90,
        step: 0.5,
      },
      foamJitter: {
        label: 'Jitter',
        value: p.foamJitter,
        min: 0,
        max: 3,
        step: 0.02,
      },
      foamSpread: {
        label: 'Lace Scale',
        value: p.foamSpread,
        min: 0.01,
        max: 100,
        step: 0.01,
      },
      foamGrain: {
        label: 'Seed Noise',
        value: p.foamGrain,
        min: 0,
        max: 1,
        step: 0.01,
      },
      foamGrainScale: {
        label: 'Seed Scale',
        value: p.foamGrainScale,
        min: 0.1,
        max: 6,
        step: 0.05,
      },
      foamAging: {
        label: 'Aging',
        value: p.foamAging,
        min: 0,
        max: 3,
        step: 0.01,
      },
      foamSink: {
        label: 'Drown',
        value: p.foamSink,
        min: 0,
        max: 1,
        step: 0.01,
      },
      foamSinkDepth: {
        label: 'Drown Depth',
        value: p.foamSinkDepth,
        min: 0.1,
        max: 6,
        step: 0.05,
      },
    },
    { collapsed: true }
  );
}
