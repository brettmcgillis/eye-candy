import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/fractalAutomata';
import { PALETTE_NAMES } from '@modules/fractalAutomataRender';

const PALETTE_CHOICES = ['None', ...PALETTE_NAMES].map((name) => [name, name]);

const sections = { choices: { paletteName: PALETTE_CHOICES } };

const preview = {
  placeholder: (metadata) => metadata.name ?? `Seed ${metadata.preset.seed}`,
  scene: 'fractalAutomata',
  stats: (config, metadata) => (
    <>
      <Stat label="Seed" value={config.seed} />
      <Stat label="Level" value={config.level} />
      <Stat label="Rules" value={config.ruleMode} />
      <Stat label="Palette" value={config.paletteName} />
      <Stat label="Detail" value={config.detailEnhanceEnabled ? 'on' : 'off'} />
      <Stat label="Godrays" value={config.godraysEnabled ? 'on' : 'off'} />
      {metadata.stats ? (
        <Stat label="Surface cells" value={metadata.stats.occupied} />
      ) : null}
    </>
  ),
};

export default function FractalAutomataWorkbenchPage() {
  return (
    <RollWorkbench
      name="Fractal Automata"
      noun={{ many: 'structures', one: 'structure' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      submitNoun="structure"
      title="FractalAutomataCLI"
      tool="fractalAutomata"
    />
  );
}
