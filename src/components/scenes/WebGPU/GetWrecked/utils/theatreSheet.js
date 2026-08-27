import { getProject, types } from '@theatre/core';

import { localEnv } from '@utils/appUtils';

import getGlitchControls from '../components/getGlitchControls';
import getPostEffectsControls from '../components/getPostEffectsControls';
import { DEFAULT_PRESET, PRESETS } from '../presets/presets';
import { THEATRE_GROUPS } from './theatreSpec';
import THEATRE_STATE from './theatreState';

const defaults = PRESETS[DEFAULT_PRESET];

// Flattened Leva schema, so a prop's range comes from the same declaration the
// tweak panel uses instead of a hand-copied duplicate that silently goes stale
// when a slider is retuned.
function flattenSchema(node) {
  const schema = node?.schema ?? node;

  return Object.entries(schema ?? {}).reduce((out, [key, value]) => {
    const isFolder =
      value &&
      typeof value === 'object' &&
      (value.schema || value.type === 'FOLDER');

    return isFolder
      ? { ...out, ...flattenSchema(value) }
      : { ...out, [key]: value };
  }, {});
}

const levaSchema = {
  ...flattenSchema(getGlitchControls(defaults, () => {})),
  ...flattenSchema(getPostEffectsControls(defaults)),
};

function buildProp(key, spec) {
  const control = levaSchema[key];
  const initial = defaults[key];

  if (typeof control?.min !== 'number') {
    return types.boolean(initial ?? false, { label: spec.label });
  }

  return types.number(initial ?? 0, {
    label: spec.label,
    range: [control.min, control.max],
    nudgeMultiplier: (control.step ?? 0.01) * 10,
  });
}

// Each group becomes a compound prop, which is what gives the studio panel its
// folders — a flat object would list all 55 keys in one column.
function buildGroups(groups) {
  return Object.fromEntries(
    Object.entries(groups).map(([groupKey, group]) => [
      groupKey,
      types.compound(
        Object.fromEntries(
          Object.entries(group.props).map(([key, spec]) => [
            key,
            buildProp(key, spec),
          ])
        ),
        { label: group.label }
      ),
    ])
  );
}

let cached = null;

export default function getTheatreSheet() {
  if (cached) return cached;

  const sheet = getProject('Get Wrecked', { state: THEATRE_STATE }).sheet(
    'Showcase'
  );

  cached = {
    sheet,
    camera: sheet.object('Camera', {
      position: types.compound(
        {
          x: types.number(3.6, { range: [-40, 40] }),
          y: types.number(2.6, { range: [-10, 40] }),
          z: types.number(2.75, { range: [-40, 40] }),
        },
        { label: 'Position' }
      ),
      lookAt: types.compound(
        {
          x: types.number(-1.2, { range: [-40, 40] }),
          y: types.number(0.5, { range: [-10, 40] }),
          z: types.number(0, { range: [-40, 40] }),
        },
        { label: 'Look At' }
      ),
      fov: types.number(50, { label: 'FOV', range: [8, 120] }),
      roll: types.number(0, { label: 'Roll', range: [-180, 180] }),
    }),
    glitch: sheet.object('Glitch', buildGroups(THEATRE_GROUPS.glitch)),
    post: sheet.object('Post FX', buildGroups(THEATRE_GROUPS.post)),
  };

  return cached;
}

let studioPromise = null;

// Studio is the authoring UI and has no business in a production bundle, so
// it's a dynamic import gated on the local env — the sequence itself plays
// from @theatre/core alone.
export function initTheatreStudio() {
  if (!localEnv()) return Promise.resolve(null);

  if (!studioPromise) {
    studioPromise = import('@theatre/studio').then((mod) => {
      mod.default.initialize();
      return mod.default;
    });
  }

  return studioPromise;
}
