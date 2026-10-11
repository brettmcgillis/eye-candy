import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/pushComesToShove';
import { PALETTE_NAMES } from '@modules/pushComesToShoveRender';

const TARGETS = {
  paintCylinders: 'cylinders',
  paintPanelFace: 'face',
  paintPanelRim: 'rim',
  paintWires: 'wires',
};

const paintedTargets = (config) =>
  Object.entries(TARGETS)
    .filter(([key]) => config[key])
    .map(([, label]) => label)
    .join(', ') || 'none';

const PALETTE_CHOICES = PALETTE_NAMES.map((name) => [name, name]);

const sections = { choices: { palette: PALETTE_CHOICES } };

const preview = {
  placeholder: (metadata) => metadata.name ?? 'Preset name',
  scene: 'pushComesToShove',
  stats: (config) => (
    <>
      <Stat label="Palette" value={config.palette} />
      <Stat label="Painted" value={paintedTargets(config)} />
      <Stat label="Wires" value={config.wireCount} />
      <Stat label="Cylinders" value={config.cylinderCount} />
      <Stat label="Hole seed" value={config.holeSeed} />
      <Stat
        label="Field"
        value={`${config.fieldWidth} × ${config.fieldHeight}`}
      />
    </>
  ),
};

export default function PushComesToShoveWorkbenchPage() {
  return (
    <RollWorkbench
      name="Push Comes to Shove"
      noun={{ many: 'panels', one: 'panel' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="PushComesToShoveCLI"
      tool="pushComesToShove"
    />
  );
}
