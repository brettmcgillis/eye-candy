import React from 'react';
import { FiPlay } from 'react-icons/fi';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/candle';

import './CandleWorkbenchPage.css';
import LiveCandle from './LiveCandle';

const preview = {
  placeholder: (metadata) =>
    metadata.name ?? `${metadata.preset.flame} ${metadata.preset.profile}`,
  scene: 'burningAtBothEnds',
  stats: (config) => (
    <>
      <Stat
        label="Flame"
        value={
          config.flame === 'out'
            ? `out, ${config.emberState}`
            : `${config.flame}, ${config.flameState}`
        }
      />
      <Stat label="Smoke" value={config.smoke} />
      <Stat label="Candle" value={`${config.profile} ${config.waxColor}`} />
      <Stat
        label="Melt"
        value={`${config.dripCount} drips, crater ${config.burnDepth}`}
      />
      <Stat label="Tilt" value={`${config.tilt}°`} />
    </>
  ),
};

const liveTab = (context) => [
  {
    icon: <FiPlay />,
    id: 'live',
    label: 'Live',
    render: () => <LiveCandle {...context} />,
  },
];

export default function CandleWorkbenchPage() {
  return (
    <RollWorkbench
      defaultTab="live"
      leadingTabs={liveTab}
      name="Candle"
      noun={{ many: 'candles', one: 'candle' }}
      preview={preview}
      schema={kernel}
      title="CandleCLI"
      tool="candle"
    />
  );
}
