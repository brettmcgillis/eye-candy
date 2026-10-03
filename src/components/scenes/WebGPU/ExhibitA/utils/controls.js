import { button, folder } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  randomSeed,
  rollExhibitConfig,
} from '@modules/exhibitA';
import { PALETTE_NAMES } from '@modules/exhibitARender';

export const SCENE_LABEL = 'ExhibitA';

const FOLDERS = {
  form: 'Form',
  look: 'Look',
  stage: 'Stage',
  motion: 'Motion',
  quality: 'Quality',
};

const titleCase = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const pathOf = (key) => {
  const { group, section } = RENDER_OPTIONS[key];
  return [
    SCENE_LABEL,
    FOLDERS[section],
    ...(group ? group.split('.') : []),
    key,
  ]
    .filter(Boolean)
    .join('.');
};

// Leva inputs straight from the option schema, so the scene's ranges,
// defaults and labels cannot drift from the CLI's.
function schemaControl(key, saved) {
  const spec = RENDER_OPTIONS[key];
  const value = saved[key] ?? spec.default;
  const base = { label: spec.label };

  if (spec.when) {
    base.render = (get) =>
      Object.entries(spec.when).every(([other, allowed]) =>
        allowed.includes(get(pathOf(other)))
      );
  }
  if (key === 'paletteName') return { ...base, options: PALETTE_NAMES, value };
  if (spec.type === 'enum') {
    return {
      ...base,
      options: Object.fromEntries(
        spec.choices.map((option) => [
          spec.optionLabels?.[option] ?? titleCase(option),
          option,
        ])
      ),
      value,
    };
  }
  if (spec.type === 'number') {
    return { ...base, max: spec.max, min: spec.min, step: spec.step, value };
  }
  return { ...base, value };
}

function toFolders(node) {
  return Object.fromEntries(
    Object.entries(node).map(([name, entry]) =>
      entry?.isGroup
        ? [name, folder(toFolders(entry.children), { collapsed: true })]
        : [name, entry]
    )
  );
}

function sectionControls(section, saved, extras) {
  const root = {};

  LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].section === section).forEach(
    (key) => {
      const { group } = RENDER_OPTIONS[key];
      let level = root;
      (group ? group.split('.') : []).forEach((name) => {
        if (!level[name]) level[name] = { children: {}, isGroup: true };
        level = level[name].children;
      });
      Object.assign(level, extras[key]?.before ?? {});
      level[key] = schemaControl(key, saved);
    }
  );

  return folder(toFolders(root), { collapsed: section !== 'form' });
}

// Rolls one facet with the rest held. A form roll keeps to the family on
// the plinth.
export function rollFacet(current, facet) {
  const rolled = rollExhibitConfig(randomSeed(), {
    base: current,
    families: [current.family],
    keep: ['form', 'look', 'stage'].filter((f) => f !== facet),
    palettes: PALETTE_NAMES,
  });
  return Object.fromEntries(
    LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].facet === facet).map(
      (key) => [key, rolled[key]]
    )
  );
}

export default function sceneFolders(saved, { onRoll }) {
  const roll = (facet) => ({
    before: {
      [`roll${facet[0].toUpperCase()}${facet.slice(1)}`]: button(() =>
        onRoll?.(facet)
      ),
    },
  });
  const extras = {
    background: roll('stage'),
    family: roll('form'),
    paletteName: roll('look'),
  };

  return Object.fromEntries(
    Object.entries(FOLDERS).map(([section, name]) => [
      name,
      sectionControls(section, saved, extras),
    ])
  );
}
