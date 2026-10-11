import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/hyperCubes';
import { PALETTE_NAMES } from '@modules/hyperCubesRender';

const PALETTE_CHOICES = [
  ['None', 'None'],
  ...PALETTE_NAMES.map((name) => [name, name]),
];

const sections = { choices: { paletteName: PALETTE_CHOICES } };

const preview = {
  placeholder: (metadata) => metadata.name ?? metadata.preset.structure,
  scene: 'hyperCubes',
  stats: (config) => (
    <>
      <Stat label="Partition" value={config.structure} />
      <Stat
        label="Seed"
        value={
          config.structure === 'octree' ? config.octreeSeed : config.rectSeed
        }
      />
      <Stat label="Shape" value={config.cellShape} />
      <Stat label="Palette" value={config.paletteName} />
      <Stat label="Frames" value={config.frameMode} />
      <Stat label="Studio" value={config.studio} />
    </>
  ),
};

export default function HyperCubesWorkbenchPage() {
  return (
    <RollWorkbench
      name="HyperCubes"
      noun={{ many: 'structures', one: 'structure' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="HyperCubesCLI"
      tool="hyperCubes"
    />
  );
}
