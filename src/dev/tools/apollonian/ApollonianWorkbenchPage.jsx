import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import { liveTabs } from '@dev/renderWorkbench/LiveStage';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/apollonian';
import { FAMILIES, FAMILY_LABELS } from '@modules/apollonian';
import { PALETTE_NAMES } from '@modules/apollonianRender';

import apollonianLive from './live';

const PALETTE_CHOICES = PALETTE_NAMES.map((name) => [name, name]);

const sections = {
  choices: { paletteName: PALETTE_CHOICES },
  open: ['output', 'video', 'svg'],
  pickers: [
    {
      key: 'families',
      label: 'Families',
      labels: FAMILY_LABELS,
      options: FAMILIES,
    },
  ],
};

const preview = {
  placeholder: (metadata) => metadata.name ?? metadata.preset.family,
  scene: 'apollonian',
  stats: (config, metadata) => (
    <>
      <Stat label="Family" value={config.family} />
      <Stat label="Bound" value={config.bound} />
      <Stat label="Surface" value={config.material} />
      <Stat label="Slice" value={config.sliceMode} />
      <Stat label="Plot" value={metadata.plot?.svgStyle} />
      <Stat label="Palette" value={config.paletteName} />
    </>
  ),
};

export default function ApollonianWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTabs(apollonianLive, 'apollonian')}
      name="Apollonian"
      noun={{ many: 'objects', one: 'object' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="ApollonianCLI"
      tool="apollonian"
    />
  );
}
