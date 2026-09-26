import { folder } from 'leva';

import { presetReader, range } from './controlHelpers';

export default function getSolverControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      renderScale: range('Render Scale', p('renderScale'), 0.4, 1.5, 0.05),
      timeScale: range('Time Scale', p('timeScale'), 0, 3, 0.05),
      substeps: range('Substeps', p('substeps'), 1, 4, 1),
      iterations: range('Iterations', p('iterations'), 2, 16, 2),
      damping: range('Damping', p('damping'), 0.8, 1, 0.005),
      relaxation: range('Relaxation', p('relaxation'), 0.2, 1.5, 0.05),
      bendStiffness: range('Bend', p('bendStiffness'), 0, 0.5, 0.005),
      collideStiffness: range('Collision', p('collideStiffness'), 0, 1.5, 0.05),
    },
    { collapsed: true }
  );
}
