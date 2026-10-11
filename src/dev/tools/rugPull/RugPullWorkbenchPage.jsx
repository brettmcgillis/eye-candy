import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/rugPull';

const sections = { open: ['output', 'mine'] };

const preview = {
  placeholder: (metadata) => metadata.name ?? `Rug ${metadata.preset.rugSeed}`,
  scene: 'rugPull',
  stats: (config, metadata) => (
    <>
      <Stat label="Design" value={config.design} />
      <Stat label="Palette" value={config.palette} />
      <Stat label="Seed" value={config.rugSeed} />
      {metadata.weave ? (
        <>
          <Stat
            label="Knots"
            value={`${metadata.weave.cols} × ${metadata.weave.rows}`}
          />
          <Stat label="Bands" value={metadata.weave.bands.join(', ')} />
          <Stat
            label="House motifs"
            value={metadata.weave.house ? 'woven in' : 'none'}
          />
        </>
      ) : null}
      <Stat label="Views" value={metadata.render?.views} />
    </>
  ),
};

const jobTitle = () => 'Rug Pull weave';

export default function RugPullWorkbenchPage() {
  return (
    <RollWorkbench
      jobTitle={jobTitle}
      kinds={['still']}
      name="Rug Pull"
      noun={{ many: 'rugs', one: 'rug' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      submitLabel="Weave rugs"
      title="RugPullCLI"
      tool="rugPull"
    />
  );
}
