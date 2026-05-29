import React from 'react';

import LightningStrikeGL from './LightningStrikeGL';
import LightningStrikeGPU from './LightningStrikeGPU';

export default function LightningStrike({ config, ...props }) {
  if (config.renderer === 'webgpu') {
    return <LightningStrikeGPU config={config} {...props} />;
  }

  return <LightningStrikeGL config={config} {...props} />;
}
