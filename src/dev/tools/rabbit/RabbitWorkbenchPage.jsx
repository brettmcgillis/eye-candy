import React from 'react';
import { FiPlay } from 'react-icons/fi';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/rabbit';
import { PALETTE_NAMES } from '@utils/gradientPalette';

import LiveRabbit from './LiveRabbit';
import './RabbitWorkbenchPage.css';

const volleyOf = (config) =>
  config.volley === 'rolled'
    ? `${config.arrowCount} arrows, seed ${config.volleySeed}`
    : 'the painting';

const preview = {
  placeholder: (metadata) =>
    metadata.name ??
    `${volleyOf(metadata.preset)} at ${metadata.preset.poseTime}s`,
  scene: 'stayHunted',
  stats: (config) => (
    <>
      <Stat label="Volley" value={volleyOf(config)} />
      <Stat
        label="Flight"
        value={`${config.volleyAzimuth}° / ${config.volleyElevation}° ±${config.volleyFan / 2}°`}
      />
      <Stat
        label="Moment"
        value={`${config.poseTime}s (settle ${config.settle}s)`}
      />
      <Stat
        label="Camera"
        value={`${config.viewAzimuth}° / ${config.viewElevation}° ×${config.viewZoom}`}
      />
    </>
  ),
};

const liveTab = (context) => [
  {
    icon: <FiPlay />,
    id: 'live',
    label: 'Live',
    render: () => <LiveRabbit {...context} />,
  },
];

export default function RabbitWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTab}
      name="Rabbit"
      noun={{ many: 'rabbits', one: 'rabbit' }}
      preview={preview}
      schema={kernel}
      sections={{
        choices: {
          paletteName: [
            ['None', 'None'],
            ...PALETTE_NAMES.map((name) => [name, name]),
          ],
        },
      }}
      title="RabbitCLI"
      tool="rabbit"
    />
  );
}
