import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import { liveTabs } from '@dev/renderWorkbench/LiveStage';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/fungi';

import fungiLive from './live';

const sections = { open: ['form', 'output', 'video'] };

const preview = {
  placeholder: (metadata) => `Seed ${metadata.preset.seed}`,
  scene: 'fungi',
  stats: (config) => (
    <>
      <Stat label="Seed" value={config.seed} />
      <Stat label="Archetype" value={config.archetype} />
      <Stat label="Mycology" value={config.mycology} />
      <Stat label="Habit" value={config.habit} />
      <Stat label="Glow" value={config.glow} />
    </>
  ),
};

export default function FungiWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTabs(fungiLive, 'fungi')}
      name="Fungi"
      noun={{ many: 'specimens', one: 'specimen' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      submitNoun="fungi"
      title="FungiCLI"
      tool="fungi"
    />
  );
}
