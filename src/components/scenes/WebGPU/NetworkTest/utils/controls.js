import { button, folder } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  keysInFacet,
  randomSeed,
  rollNetworkTestConfig,
} from '@modules/networkTest';
import { PALETTE_NAMES } from '@modules/networkTestRender';

export const SCENE_LABEL = 'Network Test';

const FOLDERS = {
  motion: 'Motion',
  points: 'Points',
  image: 'Image',
  wiring: 'Wiring',
  nodes: 'Nodes',
  edges: 'Edges',
  pulses: 'Pulses',
  stage: 'Stage',
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
export function rollFacets(current, facets) {
  const others = ['points', 'wiring', 'color', 'atmosphere'].filter(
    (facet) => !facets.includes(facet)
  );
  const rolled = rollNetworkTestConfig(randomSeed(), {
    base: current,
    keep: others,
    palettes: PALETTE_NAMES.filter((name) => name !== 'None'),
  });
  return Object.fromEntries(
    facets.flatMap((facet) =>
      keysInFacet(facet).map((key) => [key, rolled[key]])
    )
  );
}

export default function sceneFolders(saved, { onRoll, onReplay }) {
  const extras = {
    background: {
      before: { rollLook: button(() => onRoll?.(['color', 'atmosphere'])) },
    },
    motionMode: { after: { replay: button(() => onReplay?.()) } },
    pointSeed: { before: { rollPoints: button(() => onRoll?.(['points'])) } },
    sourceImage: {
      after: { sourceUpload: { image: undefined, label: 'Upload image' } },
    },
    wireSeed: { before: { rollWiring: button(() => onRoll?.(['wiring'])) } },
  };

  return Object.fromEntries(
    Object.entries(FOLDERS).map(([section, name]) => [
      name,
      sectionControls(section, saved, extras),
    ])
  );
}
