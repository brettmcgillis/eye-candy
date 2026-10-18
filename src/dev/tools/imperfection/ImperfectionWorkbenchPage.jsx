import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/imperfection';
import { PALETTE_NAMES } from '@modules/imperfectionRender';

const sections = {
  choices: {
    paletteName: [
      ['None', 'None'],
      ...PALETTE_NAMES.map((name) => [name, name]),
    ],
  },
};

const preview = {
  placeholder: (metadata) => metadata.name ?? metadata.preset.variant,
  scene: 'imperfection',
  stats: (config) => (
    <>
      <Stat label="Version" value={config.variant} />
      <Stat label="Seed" value={config.paintSeed} />
      <Stat label="Mirror" value={config.mirror ? 'yes' : 'no'} />
      <Stat label="Warm hue" value={config.warmHue} />
      <Stat label="Cool hue" value={config.coolHue} />
      <Stat label="Composition" value={config.composition} />
      <Stat label="Palette" value={config.paletteName} />
      <Stat label="Blocks" value={config.blockEngine} />
      <Stat label="Motif" value={config.motif} />
    </>
  ),
};

export default function ImperfectionWorkbenchPage() {
  return (
    <RollWorkbench
      name="Imperfection"
      noun={{ many: 'paintings', one: 'painting' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="ImperfectionCLI"
      tool="imperfection"
    />
  );
}
