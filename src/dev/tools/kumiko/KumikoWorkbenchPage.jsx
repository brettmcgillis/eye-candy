import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/kumiko';

const { POOL_KEYS } = kernel;

const sections = { open: ['panel', 'pool', 'output'] };

const preview = {
  placeholder: (metadata) => `Seed ${metadata.preset.seed}`,
  scene: 'kumiko',
  showMode: false,
  stats: (config, metadata) => (
    <>
      <Stat label="Seed" value={config.seed} />
      <Stat label="Tiling" value={config.tiling} />
      <Stat label="Pool" value={metadata.stats?.pool?.join(', ')} />
      <Stat label="Zones" value={config.zoneMode} />
      <Stat label="Subdivide" value={config.subdivide} />
      <Stat label="Palette" value={config.palette} />
      <Stat label="Pieces" value={metadata.stats?.pieces} />
    </>
  ),
};

const jobTitle = (job) => `Kumiko ${job.options?.views ?? 'stills'}`;

// Setting the pool is choosing it, so each switch is pinned as well.
function PoolButtons({ pins, setOptions }) {
  const setPool = (on) => {
    setOptions((current) => ({
      ...current,
      ...Object.fromEntries(POOL_KEYS.map((key) => [key, on])),
    }));
    pins.setPins((current) => new Set([...current, ...POOL_KEYS]));
  };
  return (
    <div className="rw-pin-groups">
      <button
        className="rw-pin-group"
        onClick={() => setPool(true)}
        type="button"
      >
        Every pattern
      </button>
      <button
        className="rw-pin-group"
        onClick={() => setPool(false)}
        type="button"
      >
        No patterns
      </button>
    </div>
  );
}

export default function KumikoWorkbenchPage() {
  return (
    <RollWorkbench
      afterFields={PoolButtons}
      jobTitle={jobTitle}
      kinds={['still']}
      name="Kumiko"
      noun={{ many: 'panels', one: 'panel' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      submitLabel="Render kumiko panels"
      title="KumikoCLI"
      tool="kumiko"
    />
  );
}
