import * as THREE from 'three';

import React, { memo, useEffect, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../../../../utils/appUtils';
import SprayCanSeparated, {
  CAN_BASE_RECENTER_Y,
  SPRAY_CAN_SEPARATED_NODE_KEYS,
} from '../../../../../elements/SprayCanSeparated/SprayCanSeparated';
import { computeSliderAxis } from '../../../../../elements/SprayCanSeparated/sliderGeometry';
import { createGradientTexture } from '../utils/sceneUtils';
import SettingsPanels from './canui/SettingsPanels';

// Matches the fixed per-mesh rotation every SprayCanSeparated part renders
// with (see the element file) — parts rendered directly here bypass that
// component, so they need the same rotation to line back up.
const PART_ROTATION = [-Math.PI / 2, 0, 0];
const PART_ROTATION_EULER = new THREE.Euler(...PART_ROTATION);
const SLIDER_PART_KEYS = ['redSlider', 'greenSlider', 'blueSlider'];
const CHANNEL_HEX = { r: '#ff2d2d', g: '#2dff5b', b: '#2d6bff' };
const CHANNEL_TO_PARTS = [
  { channel: 'r', panel: 'redPanel', slider: 'redSlider' },
  { channel: 'g', panel: 'greenPanel', slider: 'greenSlider' },
  { channel: 'b', panel: 'bluePanel', slider: 'blueSlider' },
];

// The can used for both scene modes. The body + color ring always tint to
// the current color, the model's slider knobs are always POSED to the
// current R/G/B values (display only — input happens on the flat decal
// panels, which fixes the old slider-drag vs label-pick event conflict,
// todo item 42), and in `interactive` (color-select) mode the label-style
// settings decals (wheel + sliders + toggle) mount in front of the can.
function InteractiveCan({
  interactive,
  onRgbChange,
  onSettingChange,
  rgb,
  settings,
  ...groupProps
}) {
  const { nodes, materials } = useGLTF(modelFile('sprayCanSeparated.glb'));
  const defaultMaterial = materials['default.001'];

  const tintMaterial = useMemo(
    () => defaultMaterial.clone(),
    [defaultMaterial]
  );

  const gradientMaterials = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(CHANNEL_HEX).map(([channel, hex]) => {
          const mat = defaultMaterial.clone();
          mat.map = createGradientTexture(hex);
          return [channel, mat];
        })
      ),
    [defaultMaterial]
  );

  useEffect(() => {
    tintMaterial.color.setRGB(rgb.r, rgb.g, rgb.b);
    tintMaterial.needsUpdate = true;
  }, [tintMaterial, rgb.b, rgb.g, rgb.r]);

  useEffect(
    () => () => {
      tintMaterial.dispose();
      Object.values(gradientMaterials).forEach((mat) => {
        mat.map.dispose();
        mat.dispose();
      });
    },
    [gradientMaterials, tintMaterial]
  );

  const partMaterials = useMemo(
    () => ({
      sprayCan: tintMaterial,
      colorRing: tintMaterial,
      redPanel: gradientMaterials.r,
      greenPanel: gradientMaterials.g,
      bluePanel: gradientMaterials.b,
    }),
    [gradientMaterials, tintMaterial]
  );

  // Same derivation the discarded/scattered cans use, so the handheld can's
  // posed knobs and the litter cans' knobs stay consistent.
  const sliderAxes = useMemo(
    () =>
      CHANNEL_TO_PARTS.map(({ channel, panel, slider }) => ({
        channel,
        slider,
        axis: computeSliderAxis({
          panelGeometry: nodes[SPRAY_CAN_SEPARATED_NODE_KEYS[panel]].geometry,
          sliderGeometry: nodes[SPRAY_CAN_SEPARATED_NODE_KEYS[slider]].geometry,
        }),
      })),
    [nodes]
  );

  return (
    <group {...groupProps}>
      <SprayCanSeparated
        hiddenParts={SLIDER_PART_KEYS}
        partMaterials={partMaterials}
      />
      {/* SprayCanSeparated recenters itself internally (CAN_BASE_RECENTER_Y)
          so `position` means "where the base sits" — parts rendered directly
          here need the same offset to stay lined up with it. */}
      <group position={[0, CAN_BASE_RECENTER_Y, 0]}>
        {sliderAxes.map(({ channel, slider, axis }) => (
          <mesh
            key={slider}
            geometry={nodes[SPRAY_CAN_SEPARATED_NODE_KEYS[slider]].geometry}
            material={defaultMaterial}
            rotation={PART_ROTATION}
            position={axis.axisVector
              .clone()
              .applyEuler(PART_ROTATION_EULER)
              .multiplyScalar(
                axis.restOffset + rgb[channel] * axis.localLength
              )}
            castShadow
            receiveShadow
          />
        ))}
        {interactive && (
          <SettingsPanels
            rgb={rgb}
            settings={settings}
            onRgbChange={onRgbChange}
            onSettingChange={onSettingChange}
          />
        )}
      </group>
    </group>
  );
}

export default memo(InteractiveCan);

useGLTF.preload(modelFile('sprayCanSeparated.glb'));
