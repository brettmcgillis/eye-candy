import { folder } from 'leva';

export default function getFieldControls(p) {
  return folder(
    {
      fieldResolution: {
        label: 'Resolution',
        value: p.fieldResolution,
        min: 128,
        max: 768,
        step: 32,
      },
      growthMode: {
        label: 'Growth Mode',
        value: p.growthMode,
        options: ['alwaysOn', 'onceGrow', 'seedDrops', 'manualDrops'],
      },
      // A toggle rather than a strength, because containment turns out to be a
      // threshold: any outward transport left at the rim eventually fills the
      // outside anyway, since the pattern amplifies itself. Measured, mass
      // outside the rim sits at ~23% for every partial setting and only drops
      // (to ~6%) once the outward pull is cancelled completely.
      boundaryBounce: { label: 'Edge Bounce', value: p.boundaryBounce },
      seedRadius: {
        label: 'Seed Radius',
        value: p.seedRadius,
        min: 0.01,
        max: 0.5,
        step: 0.01,
      },
      dropInterval: {
        label: 'Drop Interval (s)',
        value: p.dropInterval,
        min: 1,
        max: 60,
        step: 0.5,
      },
      // How long a drop takes to well up. 0 stamps it in a single frame, which
      // snaps the grains straight to their new height and colour.
      dropFade: {
        label: 'Drop Fade (s)',
        value: p.dropFade,
        min: 0,
        max: 8,
        step: 0.1,
      },
      // Points the camera at the newest drop. Depth of field aims at the same
      // point whenever its focus mode is `target`, so the two stay together.
      followDrop: { label: 'Follow Drop', value: p.followDrop },
      // CameraRig's `damping` is really a rate — it eases by `damping * delta`
      // each frame, so higher is faster and 0 snaps instantly. Roughly: 0.3 is
      // a ~3s pan, 1 is ~1s, 5 is a quick swing.
      followDropDamping: {
        label: 'Follow Speed (0 = snap)',
        value: p.followDropDamping,
        min: 0,
        max: 10,
        step: 0.05,
      },
      paletteRefresh: {
        label: 'Colour Refresh',
        value: p.paletteRefresh,
        min: 0,
        max: 0.05,
        step: 0.001,
      },
      fieldContrast: {
        label: 'Contrast',
        value: p.fieldContrast,
        min: 1,
        max: 30,
        step: 0.5,
      },
      decayRate: {
        label: 'Decay',
        value: p.decayRate,
        min: 0,
        max: 0.02,
        step: 0.0005,
      },
      reactionStrength: {
        label: 'Reaction Strength',
        value: p.reactionStrength,
        min: 0,
        max: 0.3,
        step: 0.001,
      },
      noiseAmount: {
        label: 'Noise Amount',
        value: p.noiseAmount,
        min: 0,
        max: 0.02,
        step: 0.0005,
      },
      expansionStrength: {
        label: 'Expansion Strength',
        value: p.expansionStrength,
        min: 0,
        max: 40,
        step: 0.5,
      },
      blurSpread: {
        label: 'Diffusion Spread',
        value: p.blurSpread,
        min: 1,
        max: 4,
        step: 1,
      },
    },
    { collapsed: true }
  );
}
