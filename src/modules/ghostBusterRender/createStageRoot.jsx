import { createStageRoot } from '@modules/renderStage';

import GhostStudio from './GhostStudio';

// GhostBusterCLI's headless root: the shared stage root with GhostStudio as
// its stage.
export default function createGhostStageRoot(options) {
  return createStageRoot({ ...options, Stage: GhostStudio });
}
