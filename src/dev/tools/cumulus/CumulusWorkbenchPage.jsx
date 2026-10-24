import React from 'react';
import { FiPlay } from 'react-icons/fi';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';
import { ListPicker } from '@dev/renderWorkbench/SchemaSections';

import * as kernel from '@modules/cumulus';

import LiveCumulus from './LiveCumulus';

function HaloPicker({ onChange, value }) {
  return (
    <ListPicker
      id="halos"
      label="Include in batches"
      labels={kernel.HALO_LABELS}
      onChange={onChange}
      options={kernel.HALOS}
      value={value}
    />
  );
}

const sections = {
  followWhen: true,
  choices: {
    paletteName: ['None', ...kernel.PALETTES].map((name) => [name, name]),
    ringsPalette: ['None', ...kernel.PALETTES].map((name) => [name, name]),
  },
  fields: { halos: HaloPicker },
};
const liveTab = (context) => [
  {
    id: 'live',
    label: 'Live',
    icon: <FiPlay />,
    render: () => <LiveCumulus {...context} />,
  },
];
const preview = {
  scene: 'allMyThoughtsAreSoCumulus',
  placeholder: (metadata) => metadata.name ?? 'Cumulus',
  stats: (config) => (
    <>
      <Stat
        label="Halo"
        value={
          kernel.HALO_LABELS[
            config.haloType === 'rings' && config.ringsStyle === 'gradient'
              ? 'gradient'
              : config.haloType
          ]
        }
      />
      <Stat label="Palette" value={config.paletteName} />
      <Stat label="Seed" value={config.haloSeed} />
    </>
  ),
};
export default function CumulusWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTab}
      name="Cumulus"
      noun={{ many: 'thoughts', one: 'thought' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="CumulusCLI"
      tool="cumulus"
    />
  );
}
