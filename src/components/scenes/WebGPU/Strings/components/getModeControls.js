import { folder } from 'leva';

import { choice, presetReader, range } from './controlHelpers';

export default function getModeControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      renderMode: choice('Render', p('renderMode'), {
        'Fibers (3D)': 'fibers',
        'Sine Threads (port)': 'sineThreads',
        'Noise Rings (port)': 'noiseRings',
      }),
      fiberMotion: choice('Fiber Motion', p('fiberMotion'), {
        Noise: 'noise',
        Simulation: 'sim',
      }),
      timeScale: range('Time Scale', p('timeScale'), 0, 3, 0.01),
    },
    { collapsed: true }
  );
}
