import React from 'react';
import { FiPlay } from 'react-icons/fi';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/dumpsterFire';

import './DumpsterFireWorkbenchPage.css';
import LiveDumpster from './LiveDumpster';

const preview = {
  placeholder: (metadata) =>
    metadata.name ??
    `${metadata.preset.smokeSystem} · ${metadata.preset.mood ?? 'day'}`,
  scene: 'dumpsterFire',
  stats: (config) => (
    <>
      <Stat
        label="Trash"
        value={
          config.trashLayout === 'rolled'
            ? `${config.trashFixed} + ${config.trashLoose} loose, ${config.trashBags} bags`
            : 'authored'
        }
      />
      <Stat
        label="Wall"
        value={
          config.brickWallEnabled
            ? `${config.brickWallLength}m × ${config.brickWallHeight}m, holes ${config.brickWallHoles}`
            : 'none'
        }
      />
      <Stat
        label="Smoke"
        value={`${config.smokeSystem}${config.smokeMirror ? ', mirrored' : ''}`}
      />
      <Stat label="Mood" value={config.mood ?? 'day'} />
      <Stat
        label="Camera"
        value={`${config.viewAzimuth}° / ${config.viewElevation}° ×${config.viewZoom} (${config.viewFrame})`}
      />
    </>
  ),
};

const liveTab = (context) => [
  {
    icon: <FiPlay />,
    id: 'live',
    label: 'Live',
    render: () => <LiveDumpster {...context} />,
  },
];

export default function DumpsterFireWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTab}
      name="DumpsterFire"
      noun={{ many: 'fires', one: 'fire' }}
      preview={preview}
      schema={kernel}
      title="DumpsterFireCLI"
      tool="dumpsterFire"
    />
  );
}
