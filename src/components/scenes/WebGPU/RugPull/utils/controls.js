import { button, folder } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  randomSeed,
  rollRugConfig,
} from '@modules/rugPull';

export const SCENE_LABEL = 'Rug Pull';

const FOLDERS = {
  room: 'Room',
  design: 'Design',
  border: 'Borders',
  mine: 'House Motifs',
  palette: 'Palette',
  age: 'Age',
};
const OPEN = new Set(['room', 'design']);

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
      Object.assign(level, extras[key]?.after ?? {});
    }
  );
  return folder(toFolders(root), { collapsed: !OPEN.has(section) });
}

// Rolls `rolling` facets with the rest held, as the CLI's --keep does.
export function rollFacets(current, rolling, context = {}) {
  const rolled = rollRugConfig(randomSeed(), {
    base: current,
    houseRate: 0.6,
    keep: facets().filter((facet) => !rolling.includes(facet)),
    ...context,
  });
  return Object.fromEntries(
    rolling.flatMap((facet) =>
      keysInFacet(facet).map((key) => [key, rolled[key]])
    )
  );
}

export default function sceneFolders(saved, { onPull, onRoll, onReweave }) {
  const extras = {
    abrash: { before: { 'Roll Age': button(() => onRoll(['age'])) } },
    design: {
      before: {
        'Roll Whole Rug': button(() =>
          onRoll(['design', 'border', 'palette', 'age'])
        ),
        'Roll Design': button(() => onRoll(['design'])),
        'Reweave (New Seed)': button(() => onReweave()),
      },
    },
    borderMotif: {
      before: { 'Roll Borders': button(() => onRoll(['border'])) },
    },
    mineMedallion: {
      before: { 'Roll House Motifs': button(() => onRoll(['mine'])) },
    },
    palette: { before: { 'Roll Palette': button(() => onRoll(['palette'])) } },
    rugMode: { after: { 'Pull The Rug!': button(() => onPull()) } },
  };
  return Object.fromEntries(
    Object.entries(FOLDERS).map(([section, name]) => [
      name,
      sectionControls(section, saved, extras),
    ])
  );
}
