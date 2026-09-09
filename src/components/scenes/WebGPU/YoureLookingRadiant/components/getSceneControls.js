import { folder } from 'leva';

import { ARGYLE_MODE_OPTIONS, ARGYLE_ORIENTATIONS } from '../utils/argyle';
import { ROLE_MODE_OPTIONS } from '../utils/roleModes';

// One level of folders, five of them, each a thing you would sit down to tune
// in one go. Sizes are fractions of field height so nothing needs retuning
// when the window changes.
const shape = (p) =>
  folder(
    {
      particleCount: {
        label: 'Count',
        max: 32,
        min: 0,
        step: 1,
        value: p.particleCount,
      },
      particleRadius: {
        label: 'Radius',
        max: 0.08,
        min: 0.002,
        step: 0.001,
        value: p.particleRadius,
      },
      arcSpan: {
        label: 'Arc Span (deg)',
        max: 300,
        min: 0,
        step: 1,
        value: p.arcSpan,
      },
      arcSpread: {
        label: 'Arc Spread',
        max: 1.2,
        min: 0.1,
        step: 0.02,
        value: p.arcSpread,
      },
      sweepPulse: {
        label: 'Sweep Pulse',
        max: 1,
        min: 0,
        step: 0.02,
        value: p.sweepPulse,
      },
      sweepRate: {
        label: 'Sweep Rate',
        max: 2,
        min: 0.05,
        step: 0.05,
        value: p.sweepRate,
      },
      seed: { label: 'Seed', max: 999, min: 1, step: 1, value: p.seed },
    },
    { collapsed: true }
  );

const motion = (p) =>
  folder(
    {
      speed: { label: 'Speed', max: 0.6, min: 0, step: 0.005, value: p.speed },
      flowScale: {
        label: 'Curl Scale',
        max: 8,
        min: 0.2,
        step: 0.1,
        value: p.flowScale,
      },
      separation: {
        label: 'Keep Apart',
        max: 1,
        min: 0,
        step: 0.05,
        value: p.separation,
      },
      pointerStrength: {
        label: 'Cursor Pull',
        max: 4,
        min: -4,
        step: 0.05,
        value: p.pointerStrength,
      },
      pointerRadius: {
        label: 'Cursor Reach',
        max: 1.5,
        min: 0.05,
        step: 0.05,
        value: p.pointerRadius,
      },
    },
    { collapsed: true }
  );

const roles = (p) =>
  folder(
    {
      roleMode: {
        label: 'Mode',
        options: ROLE_MODE_OPTIONS,
        value: p.roleMode,
      },
      dieSpeed: {
        label: 'Die Speed (Age)',
        max: 0.5,
        min: 0.01,
        step: 0.005,
        value: p.dieSpeed,
      },
      oscillatePeriod: {
        label: 'Period (Oscillate)',
        max: 30,
        min: 1,
        step: 0.5,
        value: p.oscillatePeriod,
      },
    },
    { collapsed: true }
  );

const light = (p) =>
  folder(
    {
      lightStrength: {
        label: 'Light Output',
        max: 6,
        min: 0,
        step: 0.05,
        value: p.lightStrength,
      },
      exposure: {
        label: 'Exposure',
        max: 6,
        min: 0.1,
        step: 0.05,
        value: p.exposure,
      },
      ambient: {
        label: 'Ambient Floor',
        max: 1,
        min: 0,
        step: 0.01,
        value: p.ambient,
      },
      arcLights: {
        label: 'Emitter Samples',
        max: 24,
        min: 1,
        step: 1,
        value: p.arcLights,
      },
      shadowRays: {
        label: 'Shadow Rays',
        options: { 256: 256, 512: 512, 1024: 1024, 2048: 2048 },
        value: p.shadowRays,
      },
      shadowSoftness: {
        label: 'Shadow Softness',
        max: 0.12,
        min: 0.002,
        step: 0.002,
        value: p.shadowSoftness,
      },
    },
    { collapsed: true }
  );

const colour = (p) =>
  folder(
    {
      fieldColor: { label: 'Field', value: p.fieldColor },
      matchBrightness: {
        label: 'Match Brightness',
        max: 1,
        min: 0,
        step: 0.05,
        value: p.matchBrightness,
      },
      bodyTint: { label: 'Occluding', value: p.bodyTint },
      colorA: { label: 'Emitting A', value: p.colorA },
      colorB: { label: 'Emitting B', value: p.colorB },
      colorC: { label: 'Emitting C', value: p.colorC },
      colorD: { label: 'Emitting D', value: p.colorD },
    },
    { collapsed: true }
  );

const fibonacci = (p) =>
  folder(
    {
      fibEnabled: { label: 'Show Spiral', value: p.fibEnabled },
      fibCount: {
        label: 'Count',
        max: 112,
        min: 4,
        step: 1,
        value: p.fibCount,
      },
      fibRadius: {
        label: 'Spiral Radius',
        max: 0.8,
        min: 0.05,
        step: 0.01,
        value: p.fibRadius,
      },
      fibBallRadius: {
        label: 'Ball Radius',
        max: 0.06,
        min: 0.002,
        step: 0.001,
        value: p.fibBallRadius,
      },
      fibSpin: {
        label: 'Spin',
        max: 2,
        min: -2,
        step: 0.05,
        value: p.fibSpin,
      },
      // Zero holds the spiral still. Above that it pulses, and the reference's
      // inner balls vanish and return as the swell passes through them.
      fibBreath: {
        label: 'Breath',
        max: 2,
        min: 0,
        step: 0.05,
        value: p.fibBreath,
      },
    },
    { collapsed: true }
  );

const glass = (p) =>
  folder(
    {
      refractShare: {
        label: 'Refract Share',
        max: 1,
        min: 0,
        step: 0.02,
        value: p.refractShare,
      },
      refractIor: {
        label: 'Refraction',
        max: 2.2,
        min: 1.02,
        step: 0.01,
        value: p.refractIor,
      },
      refractDepth: {
        label: 'Depth',
        max: 8,
        min: 0.2,
        step: 0.1,
        value: p.refractDepth,
      },
      refractReflect: {
        label: 'Reflection',
        max: 1,
        min: 0,
        step: 0.02,
        value: p.refractReflect,
      },
      refractDispersion: {
        label: 'Dispersion',
        max: 0.3,
        min: 0,
        step: 0.005,
        value: p.refractDispersion,
      },
    },
    { collapsed: true }
  );

const growth = (p) =>
  folder(
    {
      growthEnabled: { label: 'Grow From Light', value: p.growthEnabled },
      growthSeed: {
        label: 'Seed Strength',
        max: 2,
        min: 0,
        step: 0.02,
        value: p.growthSeed,
      },
      growthSeedInterval: {
        label: 'Seed Every (s)',
        max: 8,
        min: 0.05,
        step: 0.05,
        value: p.growthSeedInterval,
      },
      growthClear: {
        label: 'Clearance',
        max: 6,
        min: 0,
        step: 0.1,
        value: p.growthClear,
      },
      growthSeedRadius: {
        label: 'Seed Radius',
        max: 0.2,
        min: 0.005,
        step: 0.005,
        value: p.growthSeedRadius,
      },
      growthFeed: {
        label: 'Feed',
        max: 0.09,
        min: 0.01,
        step: 0.001,
        value: p.growthFeed,
      },
      growthKill: {
        label: 'Kill',
        max: 0.075,
        min: 0.04,
        step: 0.001,
        value: p.growthKill,
      },
      growthFeedBias: {
        label: 'Feed Gradient',
        max: 0.08,
        min: 0,
        step: 0.005,
        value: p.growthFeedBias,
      },
      growthRate: {
        label: 'Iterations / Frame',
        max: 32,
        min: 2,
        step: 2,
        value: p.growthRate,
      },
      growthThreshold: {
        label: 'Solid Threshold',
        max: 0.5,
        min: 0.02,
        step: 0.01,
        value: p.growthThreshold,
      },
    },
    { collapsed: true }
  );

const argyle = (p) =>
  folder(
    {
      argyleEnabled: { label: 'Show Logo', value: p.argyleEnabled },
      argyleMode: {
        label: 'Mode',
        options: ARGYLE_MODE_OPTIONS,
        value: p.argyleMode,
      },
      argyleScale: {
        label: 'Lattice Step',
        max: 0.2,
        min: 0.02,
        step: 0.005,
        value: p.argyleScale,
      },
      argyleOrientation: {
        label: 'Orientation',
        options: ARGYLE_ORIENTATIONS,
        value: p.argyleOrientation,
      },
      argyleSquareSize: {
        label: 'Square Size',
        max: 1.6,
        min: 0.3,
        step: 0.02,
        value: p.argyleSquareSize,
      },
      argyleRotation: {
        label: 'Rotation (deg)',
        max: 360,
        min: 0,
        step: 1,
        value: p.argyleRotation,
      },
      argyleCyclePeriod: {
        label: 'Cycle Period (s)',
        max: 30,
        min: 1,
        step: 0.5,
        value: p.argyleCyclePeriod,
      },
      argylePhase: {
        label: 'Family Offset (deg)',
        max: 360,
        min: 0,
        step: 5,
        value: p.argylePhase,
      },
      argyleWaveSpeed: {
        label: 'Wave Speed',
        max: 3,
        min: 0.05,
        step: 0.05,
        value: p.argyleWaveSpeed,
      },
      argyleWaveAngle: {
        label: 'Wave Angle (deg)',
        max: 360,
        min: 0,
        step: 5,
        value: p.argyleWaveAngle,
      },
      argyleOuterColor: { label: 'Outer Colour', value: p.argyleOuterColor },
      argyleInnerColor: { label: 'Inner Colour', value: p.argyleInnerColor },
    },
    { collapsed: true }
  );

export default function getSceneControls(p) {
  return {
    Spiral: fibonacci(p),
    Glass: glass(p),
    Growth: growth(p),
    Argyle: argyle(p),
    Particles: shape(p),
    Motion: motion(p),
    Roles: roles(p),
    Light: light(p),
    Colour: colour(p),
  };
}
