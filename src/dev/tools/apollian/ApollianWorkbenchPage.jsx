import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/apollian';
import { FAMILIES, FAMILY_LABELS } from '@modules/apollian';
import { PALETTE_NAMES } from '@modules/apollianRender';

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
  scene: 'apollian',
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

export default function ApollianWorkbenchPage() {
  return (
    <RollWorkbench
      name="Apollian"
      noun={{ many: 'objects', one: 'object' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="ApollianCLI"
      tool="apollian"
    />
  );
}
