import { folder } from 'leva';

import { choice, presetReader, range } from './controlHelpers';

// Simulated points and rendered samples are separate budgets: segments (in the
// Fibers folder) set how much is simulated, these set how smooth the drawn
// curve through those points is.
export default function getQualityControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      renderScale: range('Render Scale', p('renderScale'), 0.4, 1.5, 0.05),
      samples: range('Smoothness', p('samples'), 2, 64, 1),
      fiberBlend: choice('Blending', p('fiberBlend'), {
        'Soft edges': 'blended',
        'Hard edges (fastest)': 'opaque',
        'Haze (no occlusion)': 'haze',
      }),
    },
    { collapsed: true }
  );
}
