import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import { liveTabs } from '@dev/renderWorkbench/LiveStage';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/exhibitA';
import {
  EXHIBIT_LABELS,
  FAMILIES,
  FAMILY_LABELS,
  exhibitOf,
} from '@modules/exhibitA';
import { PALETTE_NAMES } from '@modules/exhibitARender';

import exhibitALive from './live';

const PALETTE_CHOICES = PALETTE_NAMES.map((name) => [name, name]);

const sections = {
  choices: { paletteName: PALETTE_CHOICES },
  followWhen: true,
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
  scene: 'exhibitA',
  stats: (config, metadata) => (
    <>
      <Stat label="Family" value={config.family} />
      <Stat label="Exhibit" value={EXHIBIT_LABELS[exhibitOf(config)]} />
      <Stat label="Material" value={config.material} />
      <Stat label="Plinth" value={config.plinth} />
      <Stat label="Palette" value={config.paletteName} />
      <Stat
        label="View"
        value={metadata.render?.view ?? metadata.render?.views}
      />
    </>
  ),
};

export default function ExhibitAWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTabs(exhibitALive, 'exhibitA')}
      name="ExhibitA"
      noun={{ many: 'exhibits', one: 'exhibit' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="ExhibitACLI"
      tool="exhibitA"
    />
  );
}
