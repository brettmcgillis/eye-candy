import React from 'react';
import { FiPlay } from 'react-icons/fi';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/birdsArentReal';
import { SPECIES_NAMES } from '@modules/birdsArentRealRender';

import './BirdsArentRealWorkbenchPage.css';
import LiveFlock from './LiveFlock';

const sections = {
  choices: { species: SPECIES_NAMES.map((name) => [name, name]) },
};

const preview = {
  placeholder: (metadata) =>
    metadata.name ??
    `${metadata.preset.birdCount} × ${metadata.preset.arrangement}`,
  stats: (config) => (
    <>
      <Stat label="Flock" value={`${config.birdCount} × ${config.species}`} />
      <Stat
        label="Arrangement"
        value={`${config.arrangement}, ${config.facing}`}
      />
      <Stat label="Gaze" value={config.gaze} />
      <Stat label="Settle" value={`${config.settle}s`} />
      <Stat
        label="Camera"
        value={`${config.cameraAzimuth}° / ${config.cameraElevation}° ×${config.cameraZoom}`}
      />
    </>
  ),
};

const liveTab = (context) => [
  {
    icon: <FiPlay />,
    id: 'live',
    label: 'Live',
    render: () => <LiveFlock {...context} />,
  },
];

export default function BirdsArentRealWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTab}
      name="BirdsArentReal"
      noun={{ many: 'flocks', one: 'flock' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="BirdsArentRealCLI"
      tool="birdsArentReal"
    />
  );
}
