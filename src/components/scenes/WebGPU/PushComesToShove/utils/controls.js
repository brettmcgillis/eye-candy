import { button, folder } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  randomSeed,
  rollShoveConfig,
} from '@modules/pushComesToShove';
import {
  PALETTE_NAMES,
  getPaletteStops,
} from '@modules/pushComesToShoveRender';

export const SCENE_LABEL = 'Push Comes to Shove';

const FOLDERS = {
  palette: 'Palette',
  panel: 'Panel',
  cavity: 'Cavity',
  wires: 'Wires',
  cylinders: 'Cylinders',
  motion: 'Motion',
  solver: 'Solver',
};

const RICH_PALETTES = PALETTE_NAMES.filter(
  (name) => (getPaletteStops(name)?.length ?? 0) >= 3
);

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
  if (key === 'palette') return { ...base, options: PALETTE_NAMES, value };
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
  const root = { ...(extras[section] ?? {}) };

  LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].section === section).forEach(
    (key) => {
      const { group } = RENDER_OPTIONS[key];
      let level = root;
      (group ? group.split('.') : []).forEach((name) => {
        if (!level[name]) level[name] = { children: {}, isGroup: true };
        level = level[name].children;
      });
      level[key] = schemaControl(key, saved);
    }
  );

  return folder(toFolders(root), { collapsed: true });
}

// One facet re-rolled with the rest held, as the workbench's Hold buttons do.
export function rollFacet(current, facet) {
  const rolled = rollShoveConfig(randomSeed(), {
    base: current,
    keep: ['structure', 'color', 'motion', 'atmosphere'].filter(
      (other) => other !== facet
    ),
    palettes: RICH_PALETTES,
    stopsOf: getPaletteStops,
  });
  return Object.fromEntries(
    LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].facet === facet).map(
      (key) => [key, rolled[key]]
    )
  );
}

export default function sceneFolders(saved, { onRoll }) {
  const extras = {
    palette: { 'Roll Colors': button(() => onRoll('color')) },
    panel: { 'Roll Structure': button(() => onRoll('structure')) },
    motion: { 'Roll Motion': button(() => onRoll('motion')) },
  };

  return Object.fromEntries(
    Object.entries(FOLDERS).map(([section, name]) => [
      name,
      sectionControls(section, saved, extras),
    ])
  );
}
