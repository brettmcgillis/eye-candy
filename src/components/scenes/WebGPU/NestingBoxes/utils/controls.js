import { button, folder } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  randomSeed,
  rollNestingBoxesConfig,
} from '@modules/nestingBoxes';
import { PALETTE_NAMES } from '@modules/nestingBoxesRender';

export const SCENE_LABEL = 'Nesting Boxes';

const FOLDERS = {
  structure: 'Structure',
  motion: 'Motion',
  color: 'Color',
  surface: 'Surface',
  windows: 'Windows',
  fog: 'Fog',
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
      Object.assign(level, extras[key]?.after ?? {});
    }
  );

  return folder(toFolders(root), { collapsed: true });
}

export function rollStructure(current) {
  const rolled = rollNestingBoxesConfig(randomSeed(), {
    base: current,
    keep: ['color', 'atmosphere'],
  });
  return Object.fromEntries(
    LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].facet === 'structure').map(
      (key) => [key, rolled[key]]
    )
  );
}

export default function sceneFolders(saved, { onRandomize, onReplay }) {
  const extras = {
    growNewSeed: { after: { replay: button(() => onReplay?.()) } },
    seed: { before: { randomize: button(() => onRandomize?.()) } },
  };

  return Object.fromEntries(
    Object.entries(FOLDERS).map(([section, name]) => [
      name,
      sectionControls(section, saved, extras),
    ])
  );
}
