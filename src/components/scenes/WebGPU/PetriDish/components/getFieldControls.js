import { folder } from 'leva';

import { SOLVERS } from '@modules/reactionDiffusion';

import { GROWTH_SOLVER } from '../utils/growthField';

const range = (label, value, min, max, step) => ({
  label,
  max,
  min,
  step,
  value,
});

export default function getFieldControls(p) {
  return folder(
    {
      solver: {
        label: 'Solver',
        options: { ...SOLVERS, 'Differential Growth': GROWTH_SOLVER },
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
      physarumSymmetry: {
        label: 'Symmetry (Physarum)',
        options: { None: 1, '2-way': 2, '4-way': 4 },
        value: p.physarumSymmetry,
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
      // GrayMatter's differential growth, run on the dish. The engine's own
      // constants are tuned in world units, so it grows at the bed's radius.
      dgSeed: range('Seed (Growth)', p.dgSeed, 0, 999999, 1),
      dgSimSpeed: range(
        'Simulation Rate (Growth)',
        p.dgSimSpeed,
        0.02,
        3,
        0.01
      ),
      dgGrowthStep: range(
        'Growth Step (Growth)',
        p.dgGrowthStep,
        0.05,
        2,
        0.01
      ),
      dgSeedInfluence: range(
        'Seed Influence (Growth)',
        p.dgSeedInfluence,
        0,
        1,
        0.01
      ),
      // 0 starts the loop in the centre, 1 against the wall.
      dgSeedOffset: range(
        'Seed Offset (Growth)',
        p.dgSeedOffset,
        0,
        0.95,
        0.01
      ),
      dgEdgeLength: range(
        'Edge Length (Growth)',
        p.dgEdgeLength,
        0.01,
        0.2,
        0.001
      ),
      dgSplitThreshold: range(
        'Split Threshold (Growth)',
        p.dgSplitThreshold,
        1.1,
        2.5,
        0.01
      ),
      dgRepulsion: range('Repulsion (Growth)', p.dgRepulsion, 0, 1, 0.01),
      dgShapeRetention: range(
        'Shape Retention (Growth)',
        p.dgShapeRetention,
        0,
        0.5,
        0.01
      ),
      dgSmoothing: range('Smoothing (Growth)', p.dgSmoothing, 0, 1, 0.01),
      dgSideBias: range('Side Bias (Growth)', p.dgSideBias, -100, 100, 1),
      dgMaxVertices: range(
        'Max Vertices (Growth)',
        p.dgMaxVertices,
        2000,
        40000,
        1000
      ),
      dgGradientBlur: range(
        'Curvature Blur (Growth)',
        p.dgGradientBlur,
        0,
        1,
        0.01
      ),
      dgLineWidth: range(
        'Ridge Width (Growth)',
        p.dgLineWidth,
        0.01,
        0.2,
        0.001
      ),
      dgLoop: { label: 'Loop (Growth)', value: p.dgLoop },
      dgGrowDuration: range('Grow (s) (Growth)', p.dgGrowDuration, 5, 300, 1),
      dgHoldDuration: range('Hold (s) (Growth)', p.dgHoldDuration, 0, 60, 0.5),
      dgRewindDuration: range(
        'Rewind (s) (Growth)',
        p.dgRewindDuration,
        0.5,
        30,
        0.5
      ),
      dgRestDuration: range('Rest (s) (Growth)', p.dgRestDuration, 0, 10, 0.1),
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
