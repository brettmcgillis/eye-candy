import React, { memo } from 'react';

import ContinuousTour from './ContinuousTour';
import TourAssembly from './TourAssembly';

// Every connection preview is a view of the same continuous descent, not a
// bespoke mock-up of one joint. Keeping separate arithmetic per join is what
// let the individual previews drift out of step with the assembly they were
// supposed to represent — so the `connection` control now only chooses where
// the camera stands.
function ConnectionStage({ config }) {
  if (config.connection === 'Area Tour') {
    return <ContinuousTour config={config} />;
  }
  return <TourAssembly config={config} />;
}

export default memo(ConnectionStage);
