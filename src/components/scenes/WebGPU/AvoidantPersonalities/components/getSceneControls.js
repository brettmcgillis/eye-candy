import { folder } from 'leva';

import { PALETTE_NAMES, PALETTE_NONE } from '@utils/gradientPalette';

import { SHAPE_OPTIONS } from '../utils/spawnShapes';
import { BORDER_OPTIONS } from '../utils/uniforms';

const emitter = (p) =>
  folder(
    {
      emitInward: {
        label: 'Share Facing In',
        max: 1,
        min: 0,
        step: 0.01,
        value: p.emitInward,
      },
      shape: { label: 'Shape', options: SHAPE_OPTIONS, value: p.shape },
      shapeOffsetX: {
        label: 'Offset X',
        max: 0.5,
        min: -0.5,
        step: 0.005,
        value: p.shapeOffsetX,
      },
      shapeOffsetY: {
        label: 'Offset Y',
        max: 0.5,
        min: -0.5,
        step: 0.005,
        value: p.shapeOffsetY,
      },
      shapeRotation: {
        label: 'Rotation',
        max: 360,
        min: 0,
        step: 1,
        value: p.shapeRotation,
      },
      shapeSize: {
        label: 'Size',
        max: 1,
        min: 0.02,
        step: 0.005,
        value: p.shapeSize,
      },
    },
    { collapsed: true }
  );

const walk = (p) =>
  folder(
    {
      clearance: {
        label: 'Clearance',
        max: 40,
        min: 1,
        step: 0.5,
        value: p.clearance,
      },
      flowCost: {
        label: 'Follow The Field',
        max: 6,
        min: 0,
        step: 0.05,
        value: p.flowCost,
      },
      lifeSteps: {
        label: 'Max Steps',
        max: 20000,
        min: 20,
        step: 20,
        value: p.lifeSteps,
      },
      stagger: {
        label: 'Start Spread',
        max: 4000,
        min: 0,
        step: 10,
        value: p.stagger,
      },
      stepLength: {
        label: 'Step Length',
        max: 24,
        min: 1,
        step: 0.5,
        value: p.stepLength,
      },
      stepsPerFrame: {
        label: 'Steps Per Frame',
        max: 12,
        min: 1,
        step: 1,
        value: p.stepsPerFrame,
      },
      turnCost: {
        label: 'Prefer Straight',
        max: 12,
        min: 0,
        step: 0.05,
        value: p.turnCost,
      },
      walkerCount: {
        label: 'Lines',
        max: 20000,
        min: 1,
        step: 1,
        value: p.walkerCount,
      },
      wobble: { label: 'Wobble', max: 3, min: 0, step: 0.01, value: p.wobble },
    },
    { collapsed: true }
  );

const curl = (p) =>
  folder(
    {
      curlEvolve: {
        label: 'Evolve',
        max: 0.6,
        min: 0,
        step: 0.005,
        value: p.curlEvolve,
      },
      curlScale: {
        label: 'Scale',
        max: 6,
        min: 0.1,
        step: 0.05,
        value: p.curlScale,
      },
      curlWeight: {
        label: 'Curl Pull',
        max: 2,
        min: 0,
        step: 0.01,
        value: p.curlWeight,
      },
    },
    { collapsed: true }
  );

const reaction = (p) =>
  folder(
    {
      feedRate: {
        label: 'Feed',
        max: 0.09,
        min: 0.01,
        step: 0.001,
        value: p.feedRate,
      },
      fieldContrast: {
        label: 'Contrast',
        max: 8,
        min: 0.5,
        step: 0.1,
        value: p.fieldContrast,
      },
      killRate: {
        label: 'Kill',
        max: 0.073,
        min: 0.03,
        step: 0.001,
        value: p.killRate,
      },
      reactionResolution: {
        label: 'Resolution',
        max: 512,
        min: 128,
        step: 128,
        value: p.reactionResolution,
      },
      reactionWeight: {
        label: 'Reaction Pull',
        max: 2,
        min: 0,
        step: 0.01,
        value: p.reactionWeight,
      },
      stepScale: {
        label: 'Iterations',
        max: 32,
        min: 2,
        step: 1,
        value: p.stepScale,
      },
    },
    { collapsed: true }
  );

// Named for the mechanism, not for the scene the mechanism was borrowed from.
const discrete = (p) =>
  folder(
    {
      axisAngle: {
        label: 'Base Axis',
        max: 360,
        min: 0,
        step: 1,
        value: p.axisAngle,
      },
      axisCell: {
        label: 'Cell Size',
        max: 300,
        min: 2,
        step: 1,
        value: p.axisCell,
      },
      axisWander: {
        label: 'Wander',
        max: 6.28,
        min: 0,
        step: 0.01,
        value: p.axisWander,
      },
      axisWeight: {
        label: 'Axis Pull',
        max: 2,
        min: 0,
        step: 0.01,
        value: p.axisWeight,
      },
    },
    { collapsed: true }
  );

const page = (p) =>
  folder(
    {
      groundColor: { label: 'Ground', value: p.groundColor },
      lineColor: { label: 'Line', value: p.lineColor },
      lineSoftness: {
        label: 'Edge Softness',
        max: 0.5,
        min: 0.005,
        step: 0.005,
        value: p.lineSoftness,
      },
      lineThreshold: {
        label: 'Ink Threshold',
        max: 1,
        min: 0.01,
        step: 0.005,
        value: p.lineThreshold,
      },
      lineWidth: {
        label: 'Nib Width',
        max: 2.4,
        min: 0.1,
        step: 0.05,
        value: p.lineWidth,
      },
      palette: {
        label: 'Palette',
        options: [PALETTE_NONE, ...PALETTE_NAMES],
        value: p.palette,
      },
      paletteExact: {
        label: 'Exact Colors',
        value: p.paletteExact,
      },
      paletteMix: {
        label: 'Palette Mix',
        max: 1,
        min: 0,
        step: 0.01,
        value: p.paletteMix,
      },
      paletteShift: {
        label: 'Palette Shift',
        max: 2,
        min: -2,
        step: 0.01,
        value: p.paletteShift,
      },
    },
    { collapsed: true }
  );

const surface = (p) =>
  folder(
    {
      border: { label: 'Frame', options: BORDER_OPTIONS, value: p.border },
      borderMargin: {
        label: 'Frame Margin',
        max: 0.3,
        min: 0,
        step: 0.005,
        value: p.borderMargin,
      },
      borderWidth: {
        label: 'Frame Weight',
        max: 5,
        min: 0.5,
        step: 0.1,
        value: p.borderWidth,
      },
      fieldResolution: {
        label: 'Page Resolution',
        max: 1792,
        min: 256,
        step: 256,
        value: p.fieldResolution,
      },
      renderScale: {
        label: 'Render Scale',
        max: 1,
        min: 0.3,
        step: 0.05,
        value: p.renderScale,
      },
      seed: { label: 'Seed', max: 9999, min: 1, step: 1, value: p.seed },
    },
    { collapsed: true }
  );

export default function getSceneControls(p) {
  return {
    Emitter: emitter(p),
    Flow: folder(
      {
        Curl: curl(p),
        'Discrete Vectors': discrete(p),
        Reaction: reaction(p),
      },
      { collapsed: true }
    ),
    Page: page(p),
    Surface: surface(p),
    Walk: walk(p),
  };
}
