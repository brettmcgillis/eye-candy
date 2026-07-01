import * as THREE from 'three';

import React, { memo } from 'react';

import SliderDecal from './SliderDecal';
import ToggleDecal from './ToggleDecal';
import WheelDecal from './WheelDecal';

// Layout is in the can model's RAW units (the whole handheld group is scaled
// by REALISTIC_CAN_SCALE): can body radius ~1.21, height ~6.72. Labels are
// cylinder sectors on the can's own axis at a slightly padded radius, so
// they read as printed labels wrapped on the can rather than floating UI
// (user feedback round 4) — alignment comes from sharing the axis, not from
// hand-placed offsets. The sector arc faces the can's local +X, the side
// the color-select camera looks at (see COLOR_SELECT_ROTATION in
// WetPaint.jsx).
const LABEL_RADIUS = 1.3;
// ~86deg of the can's circumference — comfortably inside the visible face.
const LABEL_ARC = 1.5;
const ROW_HEIGHT = 0.52;
const ROW_STEP = 0.56;
const FIRST_ROW_Y = 3.9;
// The wheel label is taller; sits above the slider stack.
const WHEEL_HEIGHT = 1.9;
const WHEEL_Y = 5.2;

const CHANNELS = [
  { key: 'r', label: 'RED', activeColor: '#ff2d2d' },
  { key: 'g', label: 'GRN', activeColor: '#2dff5b' },
  { key: 'b', label: 'BLU', activeColor: '#2d6bff' },
];

// Brush settings exposed on the can, MS-Paint-toolbox style (todo item 51).
// min/max map the 0..1 slider to the real Leva control range — keep in sync
// with the Brush folder in hooks/useSceneControls.js.
const BRUSH_SLIDERS = [
  { key: 'brushSize', label: 'SIZE', min: 0.002, max: 0.2 },
  { key: 'brushHardness', label: 'HARD', min: 0, max: 1 },
  { key: 'dripChance', label: 'DRIP', min: 0, max: 1 },
];

const GREY_STOPS = [
  [0, '#141414'],
  [1, '#e8e8e8'],
];

function rowY(index) {
  return FIRST_ROW_Y - index * ROW_STEP;
}

function SettingsPanels({ onRgbChange, onSettingChange, rgb, settings }) {
  return (
    <group>
      <WheelDecal
        radius={LABEL_RADIUS}
        arc={LABEL_ARC}
        height={WHEEL_HEIGHT}
        positionY={WHEEL_Y}
        rgb={rgb}
        onChange={onRgbChange}
      />
      {CHANNELS.map((channel, i) => (
        <SliderDecal
          key={channel.key}
          radius={LABEL_RADIUS}
          arc={LABEL_ARC}
          height={ROW_HEIGHT}
          positionY={rowY(i)}
          label={channel.label}
          trackStops={[
            [0, '#141414'],
            [1, channel.activeColor],
          ]}
          value={rgb[channel.key]}
          onChange={(t) => onRgbChange({ ...rgb, [channel.key]: t })}
        />
      ))}
      {BRUSH_SLIDERS.map((slider, i) => (
        <SliderDecal
          key={slider.key}
          radius={LABEL_RADIUS}
          arc={LABEL_ARC}
          height={ROW_HEIGHT}
          positionY={rowY(CHANNELS.length + i)}
          label={slider.label}
          trackStops={GREY_STOPS}
          value={THREE.MathUtils.clamp(
            (settings[slider.key] - slider.min) / (slider.max - slider.min),
            0,
            1
          )}
          onChange={(t) =>
            onSettingChange(
              slider.key,
              slider.min + t * (slider.max - slider.min)
            )
          }
        />
      ))}
      <ToggleDecal
        radius={LABEL_RADIUS}
        arc={LABEL_ARC}
        height={ROW_HEIGHT}
        positionY={rowY(CHANNELS.length + BRUSH_SLIDERS.length)}
        labels={['CLEAN', 'SPLAT']}
        values={['clean', 'splatter']}
        value={settings.brushTexture}
        onChange={(next) => onSettingChange('brushTexture', next)}
      />
    </group>
  );
}

export default memo(SettingsPanels);
