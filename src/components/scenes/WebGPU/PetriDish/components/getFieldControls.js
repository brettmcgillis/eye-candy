import { folder } from 'leva';

import { SOLVERS } from '@modules/reactionDiffusion';

import { GROWTH_SOLVER } from '../utils/growthField';

const FIELD_PATH = 'Petri Dish.Field';
const SOLVER_PATH = `${FIELD_PATH}.solver`;
const GROWTH_MODE_PATH = `${FIELD_PATH}.growthMode`;
const FOLLOW_DROP_PATH = `${FIELD_PATH}.Drops.followDrop`;

const range = (label, value, min, max, step) => ({
  label,
  max,
  min,
  step,
  value,
});

const whenSolver = (solver) => (get) => get(SOLVER_PATH) === solver;
const whenGrowthMode =
  (...modes) =>
  (get) =>
    modes.includes(get(GROWTH_MODE_PATH));

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
      seedRadius: {
        label: 'Seed Radius',
        value: p.seedRadius,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        render: whenGrowthMode('onceGrow', 'seedDrops', 'manualDrops'),
      },
      fieldContrast: {
        label: 'Contrast',
        value: p.fieldContrast,
        min: 1,
        max: 30,
        step: 0.5,
        render: (get) => get(SOLVER_PATH) !== GROWTH_SOLVER,
      },
      Drops: folder(
        {
          dropInterval: {
            label: 'Interval (s)',
            value: p.dropInterval,
            min: 1,
            max: 60,
            step: 0.5,
            render: whenGrowthMode('seedDrops'),
          },
          // How long a drop takes to well up. 0 stamps it in a single frame, which
          // snaps the grains straight to their new height and colour.
          dropFade: {
            label: 'Fade (s)',
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
            render: (get) => get(FOLLOW_DROP_PATH),
          },
        },
        { render: whenGrowthMode('seedDrops', 'manualDrops') }
      ),
      Expansive: folder(
        {
          reactionStrength: {
            label: 'Reaction Strength',
            value: p.reactionStrength,
            min: 0,
            max: 0.3,
            step: 0.001,
          },
          expansionStrength: {
            label: 'Expansion Strength',
            value: p.expansionStrength,
            min: 0,
            max: 40,
            step: 0.5,
          },
          decayRate: {
            label: 'Decay',
            value: p.decayRate,
            min: 0,
            max: 0.02,
            step: 0.0005,
          },
          noiseAmount: {
            label: 'Noise Amount',
            value: p.noiseAmount,
            min: 0,
            max: 0.02,
            step: 0.0005,
          },
          blurSpread: {
            label: 'Diffusion Spread',
            value: p.blurSpread,
            min: 1,
            max: 4,
            step: 1,
          },
          paletteRefresh: {
            label: 'Colour Refresh',
            value: p.paletteRefresh,
            min: 0,
            max: 0.05,
            step: 0.001,
          },
          // A toggle rather than a strength, because containment turns out to be a
          // threshold: any outward transport left at the rim eventually fills the
          // outside anyway, since the pattern amplifies itself. Measured, mass
          // outside the rim sits at ~23% for every partial setting and only drops
          // (to ~6%) once the outward pull is cancelled completely.
          boundaryBounce: { label: 'Edge Bounce', value: p.boundaryBounce },
        },
        { render: whenSolver(SOLVERS.Expansive) }
      ),
      // Gray-Scott's own parameters. The regime — spots, worms, mazes — is
      // set almost entirely by these two against each other.
      'Gray-Scott': folder(
        {
          feedRate: range('Feed', p.feedRate, 0.01, 0.09, 0.001),
          killRate: range('Kill', p.killRate, 0.04, 0.075, 0.001),
          feedBias: range('Feed Gradient', p.feedBias, 0, 0.08, 0.002),
          // Iterations per frame, not a timestep multiplier: the timestep is
          // pinned by stability, so steps are the only speed lever the solver has.
          stepScale: range('Iterations / Frame', p.stepScale, 2, 32, 2),
        },
        { render: whenSolver(SOLVERS['Gray-Scott']) }
      ),
      // Physarum's own parameters, in the reference's units: the two angles
      // are multiples of PI radians, the two distances are texels per step.
      Physarum: folder(
        {
          physarumAgents: range(
            'Agents',
            p.physarumAgents,
            16384,
            1048576,
            16384
          ),
          physarumSymmetry: {
            label: 'Symmetry',
            options: { None: 1, '2-way': 2, '4-way': 4 },
            value: p.physarumSymmetry,
          },
          physarumSensorAngle: range(
            'Sensor Angle',
            p.physarumSensorAngle,
            1,
            90,
            0.1
          ),
          physarumRotationAngle: range(
            'Rotation Angle',
            p.physarumRotationAngle,
            1,
            90,
            0.1
          ),
          physarumSensorDistance: range(
            'Sensor Distance',
            p.physarumSensorDistance,
            1,
            90,
            0.1
          ),
          physarumStepSize: range(
            'Step Size',
            p.physarumStepSize,
            0.1,
            10,
            0.1
          ),
          physarumDecay: range(
            'Trail Decay',
            p.physarumDecay,
            0.01,
            0.99,
            0.01
          ),
        },
        { render: whenSolver(SOLVERS.Physarum) }
      ),
      // GrayMatter's differential growth, run on the dish. The engine's own
      // constants are tuned in world units, so it grows at the bed's radius.
      Growth: folder(
        {
          dgSeed: range('Seed', p.dgSeed, 0, 999999, 1),
          dgSimSpeed: range('Simulation Rate', p.dgSimSpeed, 0.02, 3, 0.01),
          dgGrowthStep: range('Growth Step', p.dgGrowthStep, 0.05, 2, 0.01),
          dgSeedInfluence: range(
            'Seed Influence',
            p.dgSeedInfluence,
            0,
            1,
            0.01
          ),
          // 0 starts the loop in the centre, 1 against the wall.
          dgSeedOffset: range('Seed Offset', p.dgSeedOffset, 0, 0.95, 0.01),
          dgEdgeLength: range('Edge Length', p.dgEdgeLength, 0.01, 0.2, 0.001),
          dgSplitThreshold: range(
            'Split Threshold',
            p.dgSplitThreshold,
            1.1,
            2.5,
            0.01
          ),
          dgRepulsion: range('Repulsion', p.dgRepulsion, 0, 1, 0.01),
          dgShapeRetention: range(
            'Shape Retention',
            p.dgShapeRetention,
            0,
            0.5,
            0.01
          ),
          dgSmoothing: range('Smoothing', p.dgSmoothing, 0, 1, 0.01),
          dgSideBias: range('Side Bias', p.dgSideBias, -100, 100, 1),
          dgMaxVertices: range(
            'Max Vertices',
            p.dgMaxVertices,
            2000,
            40000,
            1000
          ),
          dgGradientBlur: range('Curvature Blur', p.dgGradientBlur, 0, 1, 0.01),
          dgLineWidth: range('Ridge Width', p.dgLineWidth, 0.01, 0.2, 0.001),
          dgLoop: { label: 'Loop', value: p.dgLoop },
          dgGrowDuration: range('Grow (s)', p.dgGrowDuration, 5, 300, 1),
          dgHoldDuration: {
            ...range('Hold (s)', p.dgHoldDuration, 0, 60, 0.5),
            render: (get) => get(`${FIELD_PATH}.Growth.dgLoop`),
          },
          dgRewindDuration: {
            ...range('Rewind (s)', p.dgRewindDuration, 0.5, 30, 0.5),
            render: (get) => get(`${FIELD_PATH}.Growth.dgLoop`),
          },
          dgRestDuration: {
            ...range('Rest (s)', p.dgRestDuration, 0, 10, 0.1),
            render: (get) => get(`${FIELD_PATH}.Growth.dgLoop`),
          },
        },
        { render: whenSolver(GROWTH_SOLVER) }
      ),
    },
    { collapsed: true }
  );
}
