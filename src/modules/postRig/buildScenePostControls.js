import { folder } from 'leva';

import EFFECTS from './effects';
import { normalizeScenePostDeclaration } from './scenePostUtils';

export default function buildScenePostControls({ post = {} } = {}) {
  const normalized = normalizeScenePostDeclaration(post);
  const controls = {
    postEnabled: { label: 'Enabled', value: normalized.enabled },
  };

  normalized.slots.forEach((slot) => {
    const effect = EFFECTS[slot.type];

    if (!effect) return;

    const merged = { ...effect.defaults, ...slot };

    controls[slot.label] = folder(
      {
        [`${slot.prefix}Enabled`]: { label: 'On', value: merged.enabled },
        ...effect.controls(merged),
      },
      { collapsed: true }
    );
  });

  return controls;
}
