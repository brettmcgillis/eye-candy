import { createStageRoot } from '@modules/renderStage';

import BirdStudio from './BirdStudio';

// BirdsArentRealCLI's headless root: the shared stage root with BirdStudio
// as its stage.
export default function createBirdStageRoot(options) {
  return createStageRoot({ ...options, Stage: BirdStudio });
}
