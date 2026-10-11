// The one way to declare an option; see docs/render-workbench.md.

export function spec(type, section, group, label, value, extra = {}) {
  return {
    default: value,
    group,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section,
    type,
    ...extra,
  };
}

export const num = (section, group, label, value, min, max, step, extra = {}) =>
  spec('number', section, group, label, value, {
    max,
    min,
    placeholder: 'N',
    step,
    ...extra,
  });

export const choice = (section, group, label, choices, value, extra = {}) =>
  spec('enum', section, group, label, value, {
    choices,
    help: `${label}: ${choices.join(', ')}`,
    ...extra,
  });

export const flag = (section, group, label, value, extra = {}) =>
  spec('boolean', section, group, label, value, extra);

export const color = (section, group, label, value, extra = {}) =>
  spec('color', section, group, label, value, extra);

// A null window only names the facet: the dice may set it, at any value.
export const rolled = (facet, window, item) =>
  window
    ? {
        ...item,
        facet,
        roll: { max: window[1], min: window[0], step: item.step },
      }
    : { ...item, facet };

export const inFacet = (facet, item) => ({ ...item, facet });

export const sceneOnly = (item) => ({ ...item, sceneOnly: true });

// Look-dev keys the scene's light/post rig owns rather than its Leva folders.
export const rigOf =
  (defaults = {}) =>
  (item) => ({
    group: null,
    rig: true,
    scene: true,
    scope: 'shared',
    section: 'post',
    ...defaults,
    ...item,
  });

// Render settings, not scene controls: they never land in a preset.
export const output = (item) => ({
  scope: 'shared',
  section: 'output',
  ...item,
});
export const still = (item) => ({ scope: 'still', section: 'output', ...item });
export const video = (item) => ({ scope: 'video', section: 'video', ...item });
export const render = (item) => ({
  scope: 'shared',
  section: 'render',
  ...item,
});
export const roll = (item) => ({ scope: 'shared', section: 'roll', ...item });
