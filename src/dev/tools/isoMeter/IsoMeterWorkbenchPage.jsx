import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/isoMeter';
import { PALETTE_NAMES } from '@utils/gradientPalette';

const PALETTE_CHOICES = [kernel.PALETTE_NONE, ...PALETTE_NAMES].map((name) => [
  name,
  name,
]);

const sections = { choices: { palette: PALETTE_CHOICES } };

const shortSeed = (seed) =>
  String(seed).startsWith('0x') ? `${String(seed).slice(0, 10)}…` : seed;

const colourOf = (config) =>
  config.palette === kernel.PALETTE_NONE
    ? 'authored'
    : `${config.palette} · ${config.paletteMode}`;

const preview = {
  placeholder: (metadata) =>
    `${metadata.preset.piece} ${shortSeed(metadata.preset.seed)}`,
  scene: 'isoMeter',
  stats: (config) => (
    <>
      <Stat label="Piece" value={config.piece} />
      <Stat label="Seed" value={shortSeed(config.seed)} />
      <Stat label="Colour" value={colourOf(config)} />
    </>
  ),
};

const baseLabel = (config) => `${config.piece} ${shortSeed(config.seed)}`;

export default function IsoMeterWorkbenchPage() {
  return (
    <RollWorkbench
      baseLabel={baseLabel}
      name="IsoMeter"
      noun={{ many: 'pieces', one: 'piece' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="IsoMeterCLI"
      tool="isoMeter"
    />
  );
}
