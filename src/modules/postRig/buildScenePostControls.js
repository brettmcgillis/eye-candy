import { folder } from 'leva';

import EFFECTS from './effects';
import { normalizeScenePostDeclaration } from './scenePostUtils';

// `controlOverrides` is the active preset's snapshot, so a scene's post folder
// opens on the values that preset asked for rather than on the declaration in
// its utils/post.js. Without it a preset's post settings only take effect once
// "reset" is pressed — the same seeding the camera and lighting rigs already
// do, which this was missing.
export default function buildScenePostControls({
  controlOverrides = {},
  post = {},
} = {}) {
  const normalized = normalizeScenePostDeclaration(post);
  const seed = (controlKey, control) =>
    controlKey in controlOverrides
      ? { ...control, value: controlOverrides[controlKey] }
      : control;

  const controls = {
    postEnabled: seed('postEnabled', {
      label: 'Enabled',
      value: normalized.enabled,
    }),
  };

  normalized.slots.forEach((slot) => {
    const effect = EFFECTS[slot.type];

    if (!effect) return;

    const merged = { ...effect.defaults, ...slot };
    const slotControls = {
      [`${slot.prefix}Enabled`]: { label: 'On', value: merged.enabled },
      ...effect.controls(merged),
    };

    controls[slot.label] = folder(
      Object.fromEntries(
        Object.entries(slotControls).map(([controlKey, control]) => [
          controlKey,
          seed(controlKey, control),
        ])
      ),
      { collapsed: true }
    );
  });

  return controls;
}
