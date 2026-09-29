import { button, folder } from 'leva';

import {
  LEVA_KEYS,
  PALETTE_NONE,
  RENDER_OPTIONS,
  randomSeed,
  rollBlockPartyConfig,
} from '@modules/blockParty';
import { PALETTE_NAMES, paletteStops } from '@modules/blockPartyRender';

export const SCENE_LABEL = 'Block Party';

const FOLDERS = {
  city: 'City',
  composition: 'Composition',
  form: 'Form',
  motion: 'Motion',
  surface: 'Surface',
  palette: 'Palette',
};

const PALETTE_OPTIONS = [PALETTE_NONE, ...PALETTE_NAMES];
const ROLLABLE_PALETTES = PALETTE_NAMES.filter(
  (name) => paletteStops(name)?.length >= 2
);

const titleCase = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Leva inputs straight from the option schema, so the scene's ranges,
// defaults and labels cannot drift from the CLI's.
function schemaControl(key, saved) {
  const spec = RENDER_OPTIONS[key];
  const value = saved[key] ?? spec.default;
  const base = { label: spec.label };

  if (key === 'palette') return { ...base, options: PALETTE_OPTIONS, value };
  if (spec.type === 'enum') {
    return {
      ...base,
      options: Object.fromEntries(
        spec.choices.map((option) => [titleCase(option), option])
      ),
      value,
    };
  }
  if (spec.type === 'number') {
    return { ...base, max: spec.max, min: spec.min, step: spec.step, value };
  }
  return { ...base, value };
}

function sectionControls(section, saved, extras) {
  const controls = {};
  const groups = {};

  LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].section === section).forEach(
    (key) => {
      const { group } = RENDER_OPTIONS[key];
      const entry = schemaControl(key, saved);

      if (!group) {
        controls[key] = entry;
      } else {
        if (!groups[group]) {
          groups[group] = {};
          controls[group] = null;
        }
        groups[group][key] = entry;
      }
      Object.assign(controls, extras[key] ?? {});
    }
  );

  Object.entries(groups).forEach(([group, entries]) => {
    controls[group] = folder(entries);
  });

  return folder(controls, { collapsed: true });
}

export function rollPalette(current) {
  return rollBlockPartyConfig(randomSeed(), {
    base: current,
    keep: ['composition', 'form'],
    palettes: ROLLABLE_PALETTES,
  });
}

export default function sceneFolders(saved, { onReseed, onRollPalette }) {
  const extras = {
    palette: { 'roll palette': button(() => onRollPalette?.()) },
    seed: { reseed: button(() => onReseed?.()) },
  };

  return Object.fromEntries(
    Object.entries(FOLDERS).map(([section, name]) => [
      name,
      sectionControls(section, saved, extras),
    ])
  );
}
