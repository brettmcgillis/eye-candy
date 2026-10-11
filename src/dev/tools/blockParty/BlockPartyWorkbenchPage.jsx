import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/blockParty';
import { PALETTE_NONE } from '@modules/blockParty';
import { PALETTE_NAMES } from '@modules/blockPartyRender';

const PALETTE_CHOICES = [PALETTE_NONE, ...PALETTE_NAMES].map((name) => [
  name,
  name,
]);

const sections = {
  choices: { palette: PALETTE_CHOICES },
  open: ['output', 'palette', 'video'],
};

const preview = {
  placeholder: (metadata) => metadata.name ?? `Seed ${metadata.preset.seed}`,
  scene: 'blockParty',
  stats: (config) => (
    <>
      <Stat label="City seed" value={config.seed} />
      <Stat label="Palette" value={config.palette} />
      <Stat label="Colour by" value={config.colorBy} />
      <Stat label="Target" value={config.colorTarget} />
      <Stat label="Glow" value={config.glowMode} />
      <Stat label="Pits" value={config.pitStyle} />
    </>
  ),
};

export default function BlockPartyWorkbenchPage() {
  return (
    <RollWorkbench
      name="Block Party"
      noun={{ many: 'cities', one: 'city' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      submitNoun="city"
      title="BlockPartyCLI"
      tool="blockParty"
    />
  );
}
