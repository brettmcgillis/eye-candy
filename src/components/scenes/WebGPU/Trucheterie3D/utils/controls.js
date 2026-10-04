import { button, folder } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  randomSeed,
  rollTubeConfig,
} from '@modules/trucheterie3d';
import { PALETTE_NAMES } from '@modules/trucheterie3dRender';

export const SCENE_LABEL = 'Trucheterie 3D';

const FOLDERS = {
  field: 'Field',
  palette: 'Palette',
  form: 'Form',
  stage: 'Stage',
  motion: 'Motion',
};

const MEATBALL_LABELS = { 0: 'Hide Loose', 1: 'Prune Loose', 2: 'Keep All' };

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
  if (key === 'blobPalette') return { ...base, options: PALETTE_NAMES, value };
  if (key === 'blobMeatballs') {
    return {
      ...base,
      options: Object.fromEntries(
        spec.choices.map((option) => [MEATBALL_LABELS[option], option])
      ),
      value,
    };
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
  if (spec.type === 'seed') return { ...base, value: String(value ?? '') };
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

// Rolls `rolling` facets with the rest held, as the CLI's --keep does. A
// structure roll is a new seed; anything else keeps the field on screen.
export function rollFacets(current, rolling) {
  const others = facets().filter((facet) => !rolling.includes(facet));
  const rolled = rollTubeConfig(randomSeed(), {
    base: current,
    keep: others,
    paletteNames: PALETTE_NAMES.filter((name) => name !== 'None'),
  });
  const keys = rolling.flatMap((facet) => keysInFacet(facet));
  if (rolling.includes('structure')) keys.push('blobSeed');
  return Object.fromEntries(
    keys
      .filter((key) => !RENDER_OPTIONS[key].rig)
      .map((key) => [key, rolled[key]])
  );
}

export default function sceneFolders(saved, { onReplay, onRoll }) {
  const extras = {
    blobPalette: {
      before: { rollPalette: button(() => onRoll?.(['palette'])) },
    },
    blobSeed: {
      before: {
        rollField: button(() => onRoll?.(['structure'])),
        rollEverything: button(() => onRoll?.(facets())),
      },
    },
    motionMode: { after: { replay: button(() => onReplay?.()) } },
    strands: { before: { rollForm: button(() => onRoll?.(['form'])) } },
  };

  return Object.fromEntries(
    Object.entries(FOLDERS).map(([section, name]) => [
      name,
      sectionControls(section, saved, extras),
    ])
  );
}
