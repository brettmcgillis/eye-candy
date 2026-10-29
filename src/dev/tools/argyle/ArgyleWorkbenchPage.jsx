import React, { memo } from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import { liveTabs } from '@dev/renderWorkbench/LiveStage';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/argyle';

import live from './live';

const preview = {
  placeholder: (metadata) => metadata.name ?? 'Argyle',
  scene: 'argyle',
  stats: (config) => (
    <>
      <Stat label="Pattern" value={config.pattern} />
      <Stat label="Dimension" value={config.dimension} />
      <Stat label="Palette" value={config.palette} />
      <Stat label="Coverage" value={config.coverage} />
      <Stat label="Motion" value={config.motion} />
    </>
  ),
};
function ArgyleWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTabs(live, 'argyle')}
      name="Argyle"
      noun={{ many: 'patterns', one: 'pattern' }}
      preview={preview}
      schema={kernel}
      title="ArgyleCLI"
      tool="argyle"
    />
  );
}
export default memo(ArgyleWorkbenchPage);
