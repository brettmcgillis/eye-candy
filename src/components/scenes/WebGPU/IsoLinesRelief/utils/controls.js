import { button, folder } from 'leva';

import { randomSeed } from '@modules/isoLines';
import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  rollIsoLinesReliefConfig,
} from '@modules/isoLinesRelief';
import { PALETTE_NAMES } from '@modules/isoLinesReliefRender';

export const SCENE_LABEL = 'Iso Lines Relief';

const FOLDERS = {
  contours: 'Contours',
  field: 'Field',
  image: 'Image',
  color: 'Colour',
  form: 'Form',
  motion: 'Motion',
};

const PALETTE_OPTIONS = ['None', ...PALETTE_NAMES.filter((n) => n !== 'None')];

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
  if (key === 'paletteName')
    return { ...base, options: PALETTE_OPTIONS, value };
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

// Rolls `facets` with the rest held, as the CLI's --keep does.
export function rollFacets(current, rolling) {
  const others = facets().filter((facet) => !rolling.includes(facet));
  const rolled = rollIsoLinesReliefConfig(randomSeed(), {
    base: current,
    keep: others,
    palettes: PALETTE_NAMES.filter((name) => name !== 'None'),
  });
  return Object.fromEntries(
    rolling.flatMap((facet) =>
      keysInFacet(facet).map((key) => [key, rolled[key]])
    )
  );
}

export default function sceneFolders(saved, { onRoll, onReplay }) {
  const extras = {
    colorMode: {
      before: { rollColour: button(() => onRoll?.(['color', 'atmosphere'])) },
    },
    fieldSeed: { before: { rollField: button(() => onRoll?.(['field'])) } },
    motionMode: { after: { replay: button(() => onReplay?.()) } },
    relief: { before: { rollForm: button(() => onRoll?.(['form'])) } },
    sourceImage: {
      after: { sourceUpload: { image: undefined, label: 'Upload image' } },
    },
    style: {
      before: { rollEverything: button(() => onRoll?.(facets())) },
    },
  };

  return Object.fromEntries(
    Object.entries(FOLDERS).map(([section, name]) => [
      name,
      sectionControls(section, saved, extras),
    ])
  );
}
