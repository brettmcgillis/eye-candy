import { createStageRoot } from '@modules/renderStage';

import RabbitStudio from './RabbitStudio';

// RabbitCLI's headless root: the shared stage root with RabbitStudio as its
// stage.
export default function createRabbitStageRoot(options) {
  return createStageRoot({ ...options, Stage: RabbitStudio });
}
