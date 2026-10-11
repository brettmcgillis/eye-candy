import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/trucheterie3d';
import { PALETTE_NAMES } from '@modules/trucheterie3dRender';

const PALETTE_CHOICES = PALETTE_NAMES.map((name) => [name, name]);

const sections = { choices: { blobPalette: PALETTE_CHOICES } };

const preview = {
  placeholder: (metadata) => metadata.name ?? metadata.preset.blobSeed,
  scene: 'trucheterie3d',
  stats: (config, metadata) => (
    <>
      <Stat label="Seed" value={config.blobSeed} />
      <Stat label="Strands" value={config.strands} />
      <Stat label="Junctions" value={config.junction} />
      <Stat label="Height" value={config.heightMode} />
      <Stat label="Profile" value={config.tubeProfile} />
      <Stat label="Palette" value={config.blobPalette} />
      {metadata.stats ? (
        <>
          <Stat label="Loops" value={metadata.stats.loops} />
          <Stat label="Capped chains" value={metadata.stats.openChains} />
          <Stat label="Crossings" value={metadata.stats.crossings} />
        </>
      ) : null}
    </>
  ),
};

export default function Trucheterie3DWorkbenchPage() {
  return (
    <RollWorkbench
      name="Trucheterie3D"
      noun={{ many: 'fields', one: 'field' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="Trucheterie3DCLI"
      tool="trucheterie3d"
    />
  );
}
