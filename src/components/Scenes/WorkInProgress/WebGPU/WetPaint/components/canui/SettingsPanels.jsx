import * as THREE from 'three';

import React, { memo } from 'react';

import { hsvToRgb, rgbToHsv } from '../../utils/sceneUtils';
import SliderDecal from './SliderDecal';
import ToggleDecal from './ToggleDecal';
import WheelDecal from './WheelDecal';

// Layout is in the can model's RAW units (the whole can group is scaled by
// REALISTIC_CAN_SCALE): can body radius ~1.21, height ~6.72. Labels are
// cylinder sectors on the can's own axis at a slightly padded radius, so
// they read as printed labels wrapped on the can rather than floating UI
// (user feedback round 4) — alignment comes from sharing the axis, not from
// hand-placed offsets. The sector arc starts on the can's local +X and can
// be rotated by the parent can to whichever side faces the camera.
//
// The panels render on the SIDE cans of the color-select lineup (user
// feedback round 5): the center can keeps its real draggable R/G/B knobs
// and no decals; `sections="wheel"` (left can) and `sections="brush"`
// (right can) split the settings. Rows sit in the can's label band
// (~raw y 1.3-4.4) — the earlier single-can stack climbed past the shoulder
// and out of frame.
const CAN_LABEL_RADIUS = 1.22;
const DECAL_SURFACE_OFFSET = 0.035;
const LABEL_RADIUS = CAN_LABEL_RADIUS + DECAL_SURFACE_OFFSET;
// ~86deg of the can's circumference — comfortably inside the visible face.
const LABEL_ARC = 1.5;
const ROW_HEIGHT = 0.46;
const ROW_STEP = 0.5;
const FIRST_ROW_Y = 4.2;
// Wheel can: wheel over the label band with K/opacity controls beneath.
const WHEEL_HEIGHT = 1.72;
const WHEEL_Y = 3.48;
const K_Y = 2.25;
const OPACITY_Y = 1.75;
const FINISH_Y = 1.25;

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

const OPACITY_STOPS = [
  [0, 'rgba(232,232,232,0.12)'],
  [1, 'rgba(232,232,232,1)'],
];

// Brush ("cap type") picker, split over three chip rows (chameleon brush
// port, todo item 71; pencil/calligraphy are the fine-detail cap types).
// Values are utils/brushes.js keys == the flat `brushTexture` Leva values.
const BRUSH_ROWS = [
  {
    labels: ['SPRAY', 'SOFT', 'SPLAT'],
    values: ['spray', 'clean', 'splatter'],
  },
  {
    labels: ['MARK', 'BLUR', 'THICK'],
    values: ['marker', 'blurry', 'thick'],
  },
  {
    labels: ['INK', 'PEN', 'CALLI'],
    values: ['inkdrop', 'pencil', 'calligraphy'],
  },
];

const FINISH_ROW = {
  labels: ['MATTE', 'METAL'],
  values: ['matte', 'metallic'],
};

function rowY(index) {
  return FIRST_ROW_Y - index * ROW_STEP;
}

function SettingsPanels({
  onRgbChange,
  onSettingChange,
  rgb,
  sections,
  settings,
  ...groupProps
}) {
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const keyBlack = 1 - hsv.v;

  return (
    <group {...groupProps}>
      {sections === 'wheel' && (
        <>
          <WheelDecal
            radius={LABEL_RADIUS}
            arc={LABEL_ARC}
            height={WHEEL_HEIGHT}
            positionY={WHEEL_Y}
            rgb={rgb}
            onChange={onRgbChange}
          />
          <SliderDecal
            radius={LABEL_RADIUS}
            arc={LABEL_ARC}
            height={ROW_HEIGHT}
            positionY={K_Y}
            label="K"
            trackStops={GREY_STOPS}
            value={keyBlack}
            onChange={(k) => onRgbChange(hsvToRgb(hsv.h, hsv.s, 1 - k))}
          />
          <SliderDecal
            radius={LABEL_RADIUS}
            arc={LABEL_ARC}
            height={ROW_HEIGHT}
            positionY={OPACITY_Y}
            label="OPAC"
            trackStops={OPACITY_STOPS}
            value={settings.brushOpacity ?? 1}
            onChange={(value) => onSettingChange('brushOpacity', value)}
          />
          <ToggleDecal
            radius={LABEL_RADIUS}
            arc={LABEL_ARC}
            height={ROW_HEIGHT}
            positionY={FINISH_Y}
            labels={FINISH_ROW.labels}
            values={FINISH_ROW.values}
            value={settings.brushFinish}
            onChange={(next) => onSettingChange('brushFinish', next)}
          />
        </>
      )}
      {sections === 'brush' && (
        <>
          {BRUSH_SLIDERS.map((slider, i) => (
            <SliderDecal
              key={slider.key}
              radius={LABEL_RADIUS}
              arc={LABEL_ARC}
              height={ROW_HEIGHT}
              positionY={rowY(i)}
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
          {BRUSH_ROWS.map((row, i) => (
            <ToggleDecal
              key={row.labels[0]}
              radius={LABEL_RADIUS}
              arc={LABEL_ARC}
              height={ROW_HEIGHT}
              positionY={rowY(BRUSH_SLIDERS.length + i)}
              labels={row.labels}
              values={row.values}
              value={settings.brushTexture}
              onChange={(next) => onSettingChange('brushTexture', next)}
            />
          ))}
        </>
      )}
    </group>
  );
}

export default memo(SettingsPanels);
