import { folder } from 'leva';

import attractorFields from '../utils/attractorFields';
import { MODES, STRANGE_ATTRACTORS_MODE } from '../utils/modes';

const ATTRACTOR_TYPES = Object.keys(attractorFields);

// Attractor swarm controls. Keys match presets/presets.js 1:1
// (docs/scene-conventions.md §9). `attractorB`'s range is taken from
// whichever attractor is selected when this schema is built — with a
// single registered attractor that's a non-issue; once a second attractor
// lands, rebuild this schema on attractorType change (see
// Template/SceneTemplate for the camera-controls-key rebuild pattern) so
// the range tracks the active attractor.
export default function getSwarmControls(p = {}) {
  const attractorType = p.attractorType ?? ATTRACTOR_TYPES[0];
  const { defaults, ranges } = attractorFields[attractorType];
  const [bMin, bMax, bStep] = ranges.b;

  return folder({
    mode: {
      label: 'Mode',
      value: p.mode ?? STRANGE_ATTRACTORS_MODE,
      options: MODES,
    },
    attractorType: {
      label: 'Attractor',
      value: attractorType,
      options: ATTRACTOR_TYPES,
    },
    attractorB: {
      label: 'Attractor B',
      value: p.attractorB ?? defaults.b,
      min: bMin,
      max: bMax,
      step: bStep,
    },
    particleCount: {
      label: 'Particle Count',
      value: p.particleCount ?? 2500,
      min: 200,
      max: 40000,
      step: 100,
    },
    sakuraRatio: {
      label: 'Sakura Mix',
      value: p.sakuraRatio ?? 0.35,
      min: 0,
      max: 1,
      step: 0.01,
    },
    stepSize: {
      label: 'Step Size',
      value: p.stepSize ?? 0.1,
      min: 0.01,
      max: 0.3,
      step: 0.001,
    },
    speed: { label: 'Speed', value: p.speed ?? 1, min: 0, max: 4, step: 0.01 },
    worldScale: {
      label: 'World Scale',
      value: p.worldScale ?? 1.4,
      min: 0.2,
      max: 6,
      step: 0.05,
    },
    leafScale: {
      label: 'Leaf Scale',
      value: p.leafScale ?? 0.1,
      min: 0.1,
      max: 4,
      step: 0.05,
    },
    sakuraScale: {
      label: 'Sakura Scale',
      value: p.sakuraScale ?? 4,
      min: 0.1,
      max: 4,
      step: 0.05,
    },
  });
}
