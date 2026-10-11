import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/isoLines';
import { PALETTE_NAMES } from '@modules/isoLinesRender';

const PALETTE_CHOICES = [
  ['None', 'None'],
  ...PALETTE_NAMES.map((name) => [name, name]),
];

const sections = { choices: { paletteName: PALETTE_CHOICES } };

const preview = {
  placeholder: (metadata) =>
    metadata.name ?? `Seed ${metadata.preset.fieldSeed}`,
  scene: 'isoLines',
  stats: (config, metadata) => (
    <>
      <Stat label="Field seed" value={config.fieldSeed} />
      <Stat label="Style" value={config.style} />
      <Stat label="Levels" value={config.levels} />
      <Stat label="Colour" value={config.colorMode} />
      {metadata.stats ? (
        <>
          <Stat label="Grid" value={metadata.stats.grid.join(' × ')} />
          <Stat label="Segments" value={metadata.stats.segments} />
        </>
      ) : null}
    </>
  ),
};

export default function IsoLinesWorkbenchPage() {
  return (
    <RollWorkbench
      jobTitle={(job) =>
        job.kind === 'video' ? 'IsoLines video' : 'IsoLines stills'
      }
      name="IsoLines"
      noun={{ many: 'pieces', one: 'piece' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="IsoLinesCLI"
      tool="isoLines"
    />
  );
}
