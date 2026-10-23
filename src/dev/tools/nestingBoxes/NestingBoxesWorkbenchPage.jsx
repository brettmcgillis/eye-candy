import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import { liveTabs } from '@dev/renderWorkbench/LiveStage';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/nestingBoxes';
import { PALETTE_NAMES } from '@modules/nestingBoxesRender';

import nestingBoxesLive from './live';

const PALETTE_CHOICES = PALETTE_NAMES.map((name) => [name, name]);

const sections = { choices: { paletteName: PALETTE_CHOICES } };

const preview = {
  placeholder: (metadata) => metadata.name ?? `Seed ${metadata.preset.seed}`,
  scene: 'nestingBoxes',
  stats: (config) => (
    <>
      <Stat label="Tree seed" value={config.seed} />
      <Stat label="Depth" value={config.levels} />
      <Stat label="Colour" value={config.colorMode} />
      {config.colorMode === 'palette' ? (
        <Stat label="Palette" value={config.paletteName} />
      ) : null}
      <Stat label="Surface" value={config.surface} />
      <Stat label="Fog" value={config.fogEnabled ? 'on' : 'off'} />
    </>
  ),
};

export default function NestingBoxesWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTabs(nestingBoxesLive, 'nestingBoxes')}
      name="Nesting Boxes"
      noun={{ many: 'trees', one: 'tree' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      submitNoun="tree"
      title="NestingBoxesCLI"
      tool="nestingBoxes"
    />
  );
}
