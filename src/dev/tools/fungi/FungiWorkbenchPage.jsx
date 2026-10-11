import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/fungi';

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
