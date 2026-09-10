import { folder } from 'leva';

import { SOLVERS } from '@modules/reactionDiffusion';

export default function getFieldControls(p) {
  return folder(
    {
      solver: {
        label: 'Solver',
        options: SOLVERS,
        value: p.solver,
      },
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
      // Gray-Scott's own parameters. The regime — spots, worms, mazes — is
      // set almost entirely by these two against each other.
      feedRate: {
        label: 'Feed (Gray-Scott)',
        max: 0.09,
        min: 0.01,
        step: 0.001,
        value: p.feedRate,
      },
      killRate: {
        label: 'Kill (Gray-Scott)',
        max: 0.075,
        min: 0.04,
        step: 0.001,
        value: p.killRate,
      },
      feedBias: {
        label: 'Feed Gradient (Gray-Scott)',
        max: 0.08,
        min: 0,
        step: 0.002,
        value: p.feedBias,
      },
      // Iterations per frame, not a timestep multiplier: the timestep is
      // pinned by stability, so steps are the only speed lever the solver has.
      stepScale: {
        label: 'Iterations / Frame (Gray-Scott)',
        max: 32,
        min: 2,
        step: 2,
        value: p.stepScale,
      },
      // Physarum's own parameters, in the reference's units: the two angles
      // are multiples of PI radians, the two distances are texels per step.
      physarumAgents: {
        label: 'Agents (Physarum)',
        max: 1048576,
        min: 16384,
        step: 16384,
        value: p.physarumAgents,
      },
      physarumSensorAngle: {
        label: 'Sensor Angle (Physarum)',
        max: 90,
        min: 1,
        step: 0.1,
        value: p.physarumSensorAngle,
      },
      physarumRotationAngle: {
        label: 'Rotation Angle (Physarum)',
        max: 90,
        min: 1,
        step: 0.1,
        value: p.physarumRotationAngle,
      },
      physarumSensorDistance: {
        label: 'Sensor Distance (Physarum)',
        max: 90,
        min: 1,
        step: 0.1,
        value: p.physarumSensorDistance,
      },
      physarumStepSize: {
        label: 'Step Size (Physarum)',
        max: 10,
        min: 0.1,
        step: 0.1,
        value: p.physarumStepSize,
      },
      physarumDecay: {
        label: 'Trail Decay (Physarum)',
        max: 0.99,
        min: 0.01,
        step: 0.01,
        value: p.physarumDecay,
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
