import { button, folder } from 'leva';

import {
  RENDER_OPTIONS,
  levaKeysFor,
  randomSeed,
  rollBrutalistConfig,
} from '@modules/brutalist';

export const SCENE_LABEL = 'Brutalist';

const STAGE = 'forest';
const LEVA_KEYS = levaKeysFor(STAGE);
// Leva keys plus the lighting rig's, which live in the same store.
const STAGE_KEYS = Object.keys(RENDER_OPTIONS).filter(
  (key) =>
    RENDER_OPTIONS[key].scene && RENDER_OPTIONS[key].stages.includes(STAGE)
);
const FOLDERS = {
  form: 'Form',
  surface: 'Surface',
  site: 'Site',
  atmosphere: 'Atmosphere',
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

  return folder(toFolders(root), { collapsed: true });
}

// Rolls one facet with the rest held.
export function rollFacet(current, facet) {
  const rolled = rollBrutalistConfig(randomSeed(), {
    base: current,
    keep: ['form', 'weather', 'site', 'mood'].filter((f) => f !== facet),
  });
  return Object.fromEntries(
    STAGE_KEYS.filter((key) => RENDER_OPTIONS[key].facet === facet).map(
      (key) => [key, rolled[key]]
    )
  );
}

export default function sceneFolders(saved, { onRoll }) {
  const extras = {
    family: { before: { randomize: button(() => onRoll?.('form')) } },
    look: { before: { weather: button(() => onRoll?.('weather')) } },
    siteSeed: { before: { reroll: button(() => onRoll?.('site')) } },
    skyZenith: { before: { mood: button(() => onRoll?.('mood')) } },
  };

  return Object.fromEntries(
    Object.entries(FOLDERS).map(([section, name]) => [
      name,
      sectionControls(section, saved, extras),
    ])
  );
}
