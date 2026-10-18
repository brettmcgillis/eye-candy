import React from 'react';
import { FiPlay } from 'react-icons/fi';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/ghostBuster';
import { SKIN_NAMES } from '@modules/ghostBusterRender';

import './GhostBusterWorkbenchPage.css';
import LiveGhost from './LiveGhost';

const sections = {
  choices: { skin: SKIN_NAMES.map((name) => [name, name]) },
};

const preview = {
  placeholder: (metadata) => metadata.name ?? metadata.preset.skin,
  stats: (config) => (
    <>
      <Stat label="Skin" value={config.skin} />
      <Stat label="Location" value={config.location} />
      <Stat label="Backdrop" value={config.backdrop} />
      <Stat
        label="Wind"
        value={`${config.windStrength} from ${config.windAngle}°`}
      />
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
    render: () => <LiveGhost {...context} />,
  },
];

export default function GhostBusterWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTab}
      name="GhostBuster"
      noun={{ many: 'ghosts', one: 'ghost' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="GhostBusterCLI"
      tool="ghostBuster"
    />
  );
}
