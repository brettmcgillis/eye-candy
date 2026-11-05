import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import { liveTabs } from '@dev/renderWorkbench/LiveStage';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/cables';
import { PALETTE_NAMES } from '@modules/cablesRender';

import cablesLive from './live';

const PALETTE_CHOICES = [
  ['None', 'None'],
  ...PALETTE_NAMES.map((name) => [name, name]),
];

const sections = { choices: { paletteName: PALETTE_CHOICES } };

const preview = {
  placeholder: (metadata) => metadata.name ?? metadata.preset.layout,
  scene: 'cables',
  stats: (config) => (
    <>
      <Stat label="Layout" value={config.layout} />
      <Stat label="Seed" value={config.fieldSeed} />
      <Stat label="Strands" value={config.strands} />
      <Stat label="Turn" value={config.turn} />
      <Stat label="Colour" value={config.colorMode} />
      <Stat label="Palette" value={config.paletteName} />
    </>
  ),
};

export default function CablesWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTabs(cablesLive, 'cables')}
      name="Cables"
      noun={{ many: 'tangles', one: 'tangle' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="CablesCLI"
      tool="cables"
    />
  );
}
