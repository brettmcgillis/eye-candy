import { choice, flag, num } from '@modules/optionSchema/index.mjs';

import { PROFILES, bounds, meanHex } from '../../kernel';
import posePigeon, { SCENE } from './pose';

const DEG = Math.PI / 180;
// The legs' thinnest section in scene units, measured by slicing the posed
// bird (0.62 mm at 60 mm tall): what decides whether a print survives.
const LEG = 0.00687;
const AXES = { depth: 2, height: 1, width: 0 };
const SWEEP = (SCENE.sweepRange * 180) / Math.PI;

// Moments of the idle clip and camera sweep that read as distinct poses.
// The sweep is the scene's own range (±sweepRange); + pans to the bird's left.
const POSES = {
  'On watch': { pan: 0, time: 0 },
  'Looking down': { pan: 0, time: 2.2 },
  'Sweeping left': { pan: SWEEP, time: 0 },
  'Sweeping right': { pan: -SWEEP, time: 0 },
  'Head turned': { pan: SWEEP * 0.5, time: 4.5 },
  Custom: null,
};
const POSE_NAMES = Object.keys(POSES);
const PARTS = [
  { id: 'body', label: 'Pigeon' },
  { id: 'camera', label: 'Camera' },
  { id: 'lens', label: 'Lens' },
  { id: 'led', label: 'REC light' },
];

export default {
  id: 'pigeon',
  label: 'Surveillance pigeon',
  source: 'WebGPU/BirdsArentReal',
  description:
    'A Birds Aren’t Real pigeon with its security-camera head, posed from its idle clip and printed as a solid figurine.',
  defaults: {
    mount: 'plinth',
    signature: 'bret',
    signatureBaseTop: true,
    size: 60,
  },
  mounts: ['none', 'plinth'],
  sectionLabels: { piece: 'Pigeon' },
  signatureSpots: ['baseTop', 'baseUnder'],
  variants: POSE_NAMES.filter((name) => POSES[name]),
  options: {
    variant: choice('piece', null, 'Pose', POSE_NAMES, 'On watch', {
      placeholder: 'NAME',
    }),
    poseTime: num('piece', null, 'Clip time (s)', 0, 0, 7.4, 0.05, {
      when: { variant: ['Custom'] },
    }),
    headPan: num('piece', null, 'Camera pan (°, + = its left)', 0, -90, 90, 1, {
      when: { variant: ['Custom'] },
    }),
    led: flag('piece', null, 'REC light', true),
    footTrim: num('mount', null, 'Flatten the feet (mm)', 0.4, 0, 5, 0.1, {
      when: { mount: ['none'] },
    }),
    plinthSink: num(
      'mount',
      null,
      'Feet sink into the base (mm)',
      1,
      0.2,
      5,
      0.1,
      {
        when: { mount: ['plinth'] },
      }
    ),
  },

  async build(options) {
    const pose = POSES[options.variant] ?? {
      pan: options.headPan,
      time: options.poseTime,
    };
    const solids = posePigeon({
      led: options.led,
      pan: pose.pan * DEG,
      time: pose.time,
    });
    const box = bounds(
      Float64Array.from(solids.flatMap((solid) => Array.from(solid.positions)))
    );
    const extent =
      options.sizeAxis === 'longest'
        ? Math.max(...box.size)
        : box.size[AXES[options.sizeAxis]];
    const leg = (LEG * options.size) / extent;
    const profile = PROFILES[options.profile];
    const warnings = [];
    if (leg < profile.minWall) {
      const needed = Math.ceil((profile.minWall * extent) / LEG);
      warnings.push(
        `The legs come out about ${leg.toFixed(2)} mm thick, under ${profile.label}'s ${profile.minWall} mm minimum, so they may break off or not print. Fix: Print → Size (mm) to at least ${needed}, or Print → Material Resin, and keep Mount → Base under it so the feet are held.`
      );
    } else if (leg < profile.recommendedWall) {
      const comfortable = Math.ceil((profile.recommendedWall * extent) / LEG);
      warnings.push(
        `The legs come out about ${leg.toFixed(2)} mm thick: printable in ${profile.label}, but fragile. Fix: Print → Size (mm) to ${comfortable} for sturdy legs, and keep Mount → Base under it so the feet are held.`
      );
    }
    return {
      markColor: '#202020',
      mountColor: '#5a5a5a',
      solidParts: PARTS.map(({ id, label }) => ({
        color: meanHex(
          solids
            .filter((solid) => solid.part === id)
            .flatMap((solid) => Array.from(solid.colors))
        ),
        id,
        label,
      })),
      solids,
      stats: { pose: options.variant },
      vertexColors: true,
      warnings,
    };
  },
};
