import { folder } from 'leva';

import attractorFields, { paramKey } from '../utils/attractorFields';
import { MODES, STRANGE_ATTRACTORS_MODE } from '../utils/modes';

const ATTRACTOR_TYPES = Object.keys(attractorFields);

// Every attractor's params get a flat, namespaced control (paramKey, e.g.
// 'thomasB'/'butterflyA') up front, regardless of which attractor is
// currently selected — so the schema never needs to be rebuilt on
// attractorType change (docs/scene-conventions.md §9: flat keys, no
// reshaping) and switching attractors just changes which of these are
// actually read by the physics (see LeafSwarm's buildModeAssets).
function getAttractorParamControls(p) {
  const controls = {};
  ATTRACTOR_TYPES.forEach((type) => {
    const entry = attractorFields[type];
    entry.paramNames.forEach((name) => {
      const key = paramKey(entry.key, name);
      const [min, max, step] = entry.ranges[name];
      controls[key] = {
        label: `${type} ${name.toUpperCase()}`,
        value: p[key] ?? entry.defaults[name],
        min,
        max,
        step,
      };
    });
  });
  return controls;
}

// Attractor swarm controls. Keys match presets/presets.js 1:1
// (docs/scene-conventions.md §9).
export default function getSwarmControls(p = {}) {
  const attractorType = p.attractorType ?? ATTRACTOR_TYPES[0];

  return folder(
    {
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
      ...getAttractorParamControls(p),
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
      speed: {
        label: 'Swarm Speed',
        value: p.speed ?? 1,
        min: 0,
        max: 4,
        step: 0.01,
      },
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
        max: 10,
        step: 0.05,
      },
      orientationJitter: {
        label: 'Orientation Jitter',
        value: p.orientationJitter ?? 1,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
