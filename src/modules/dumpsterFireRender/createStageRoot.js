import { createStageRoot } from '@modules/renderStage';

import DumpsterStage from './DumpsterStage';

// DumpsterFireCLI's headless root: the shared stage root with DumpsterStage
// as its stage.
export default function createDumpsterStageRoot(options) {
  return createStageRoot({ ...options, Stage: DumpsterStage });
}
