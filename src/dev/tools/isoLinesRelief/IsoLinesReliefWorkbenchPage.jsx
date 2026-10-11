import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/isoLinesRelief';
import { PALETTE_NAMES } from '@modules/isoLinesReliefRender';

const PALETTE_CHOICES = [
  ['None', 'None'],
  ...PALETTE_NAMES.map((name) => [name, name]),
];

const sections = { choices: { paletteName: PALETTE_CHOICES } };

const preview = {
  placeholder: (metadata) =>
    metadata.name ?? `Seed ${metadata.preset.fieldSeed}`,
  scene: 'isoLinesRelief',
  stats: (config, metadata) => (
    <>
      <Stat label="Field seed" value={config.fieldSeed} />
      <Stat label="Style" value={config.style} />
      <Stat label="Walls" value={config.wallMode} />
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

export default function IsoLinesReliefWorkbenchPage() {
  return (
    <RollWorkbench
      name="IsoLinesRelief"
      noun={{ many: 'pieces', one: 'piece' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="IsoLinesReliefCLI"
      tool="isoLinesRelief"
    />
  );
}
