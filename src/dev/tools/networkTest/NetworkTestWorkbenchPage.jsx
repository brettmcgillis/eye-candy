import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/networkTest';
import { PALETTE_NAMES } from '@modules/networkTestRender';

const PALETTE_CHOICES = [
  ['None', 'None'],
  ...PALETTE_NAMES.map((name) => [name, name]),
];

const sections = { choices: { paletteName: PALETTE_CHOICES } };

const preview = {
  placeholder: (metadata) =>
    metadata.name ?? `Seed ${metadata.preset.pointSeed}`,
  scene: 'networkTest',
  stats: (config, metadata) => (
    <>
      <Stat label="Points seed" value={config.pointSeed} />
      <Stat label="Wiring seed" value={config.wireSeed} />
      <Stat label="Mood" value={config.mood} />
      <Stat label="Palette" value={config.paletteName} />
      {metadata.stats ? (
        <>
          <Stat label="Points" value={metadata.stats.points} />
          <Stat label="Edges" value={metadata.stats.edges} />
          <Stat
            label="Generators"
            value={metadata.stats.placements.join(', ')}
          />
        </>
      ) : null}
    </>
  ),
};

export default function NetworkTestWorkbenchPage() {
  return (
    <RollWorkbench
      name="NetworkTest"
      noun={{ many: 'networks', one: 'network' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="NetworkTestCLI"
      tool="networkTest"
    />
  );
}
