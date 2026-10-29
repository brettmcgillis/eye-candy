import { createStageRoot } from '@modules/renderStage';

import CandleStage from './CandleStage';

// CandleCLI's headless root: the shared stage root with CandleStage as its
// stage.
export default function createCandleStageRoot(options) {
  return createStageRoot({ ...options, Stage: CandleStage });
}
