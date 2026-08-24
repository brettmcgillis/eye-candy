import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useGLTF } from '@react-three/drei';

import * as THREE from 'three';

import SprayCanSeparated, {
  CAN_BASE_RECENTER_Y,
  SPRAY_CAN_SEPARATED_NODE_KEYS,
} from '@elements/SprayCanSeparated/SprayCanSeparated';
import { computeSliderAxis } from '@elements/SprayCanSeparated/sliderGeometry';
import { modelFile } from '@utils/appUtils';

import { createGradientTexture } from '../utils/sceneUtils';
import SettingsPanels from './canui/SettingsPanels';

// Matches the fixed per-mesh rotation every SprayCanSeparated part renders
// with (see the element file) — parts rendered directly here bypass that
// component, so they need the same rotation to line back up.
const PART_ROTATION = [-Math.PI / 2, 0, 0];
const PART_ROTATION_EULER = new THREE.Euler(...PART_ROTATION);
const SETTINGS_PANEL_POSITION = [0, -CAN_BASE_RECENTER_Y, 0];
const SETTINGS_PANEL_ROTATION = [0, Math.PI, 0];
const SLIDER_PART_KEYS = ['redSlider', 'greenSlider', 'blueSlider'];
const CHANNEL_HEX = { r: '#ff2d2d', g: '#2dff5b', b: '#2d6bff' };
const CHANNEL_TO_PARTS = [
  { channel: 'r', panel: 'redPanel', slider: 'redSlider' },
  { channel: 'g', panel: 'greenPanel', slider: 'greenSlider' },
  { channel: 'b', panel: 'bluePanel', slider: 'blueSlider' },
];

const tmpW0 = new THREE.Vector3();
const tmpWorldScale = new THREE.Vector3();

// The can used for both scene modes. The body + color ring always tint to
// the current color, and the model's slider knobs are posed to the current
// R/G/B values. In color-select mode the knobs are REAL drag controls
// (`interactive` — grab a knob and slide it along its groove, todo items
// 42/69); the wheel/brush settings live on separate label-decal cans
// (`decals`: 'wheel' | 'brush') flanking this one so nothing floats above
// the geometry. `showSliders` off hides the knobs on those decal cans.
function InteractiveCan({
  decals = null,
  interactive = false,
  onRgbChange,
  onSettingChange,
  rgb,
  settings,
  showSliders = true,
  ...groupProps
}) {
  const { nodes, materials } = useGLTF(modelFile('sprayCanSeparated.glb'));
  const defaultMaterial = materials['default.001'];

  const tintMaterial = useMemo(
    () => defaultMaterial.clone(),
    [defaultMaterial]
  );

  // White cap (todo item 74) — matches the instanced litter cans' caps.
  const capMaterial = useMemo(() => {
    const mat = defaultMaterial.clone();
    mat.color.set('#e8e8e8');
    return mat;
  }, [defaultMaterial]);

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
      capMaterial.dispose();
      Object.values(gradientMaterials).forEach((mat) => {
        mat.map.dispose();
        mat.dispose();
      });
    },
    [capMaterial, gradientMaterials, tintMaterial]
  );

  const partMaterials = useMemo(
    () => ({
      sprayCan: tintMaterial,
      colorRing: tintMaterial,
      sprayCap: capMaterial,
      redPanel: gradientMaterials.r,
      greenPanel: gradientMaterials.g,
      bluePanel: gradientMaterials.b,
    }),
    [capMaterial, gradientMaterials, tintMaterial]
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

  const innerRef = useRef(null);
  const dragRef = useRef(null);

  // Knob dragging: on grab, freeze the knob's groove as a world-space line
  // (origin = grab point, direction = slider axis); each move finds the
  // closest point on that line to the pointer ray and maps the offset from
  // the grab point back to a 0..1 value. Absolute mapping from the grabbed
  // value means no drift, and pointer capture keeps the drag alive when the
  // cursor slips off the small knob mesh.
  const beginDrag = (e, channel, axis) => {
    if (!interactive) return;
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    const inner = innerRef.current;
    inner.updateWorldMatrix(true, false);
    const worldDir = axis.axisVector
      .clone()
      .applyEuler(PART_ROTATION_EULER)
      .transformDirection(inner.matrixWorld);
    dragRef.current = {
      channel,
      grabPoint: e.point.clone(),
      worldDir,
      worldLen: axis.localLength * inner.getWorldScale(tmpWorldScale).x,
      startValue: rgb[channel],
    };
  };

  const moveDrag = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    e.stopPropagation();
    // Closest-approach parameter of the groove line to the pointer ray
    // (both directions unit length, so a = c = 1).
    tmpW0.subVectors(e.ray.origin, drag.grabPoint);
    const b = e.ray.direction.dot(drag.worldDir);
    const d = e.ray.direction.dot(tmpW0);
    const eDot = drag.worldDir.dot(tmpW0);
    const denom = 1 - b * b;
    if (Math.abs(denom) < 1e-5) return;
    const tc = (eDot - b * d) / denom;
    const next = THREE.MathUtils.clamp(
      drag.startValue + tc / drag.worldLen,
      0,
      1
    );
    onRgbChange({ ...rgb, [drag.channel]: next });
  };

  const endDrag = (e) => {
    if (!dragRef.current) return;
    e.target.releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
  };

  return (
    <group {...groupProps}>
      <SprayCanSeparated
        hiddenParts={SLIDER_PART_KEYS}
        partMaterials={partMaterials}
      />
      {/* SprayCanSeparated recenters itself internally (CAN_BASE_RECENTER_Y)
          so `position` means "where the base sits" — parts rendered directly
          here need the same offset to stay lined up with it. */}
      <group ref={innerRef} position={[0, CAN_BASE_RECENTER_Y, 0]}>
        {showSliders &&
          sliderAxes.map(({ channel, slider, axis }) => (
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
              onPointerDown={(e) => beginDrag(e, channel, axis)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              castShadow
              receiveShadow
            />
          ))}
        {decals && (
          <SettingsPanels
            position={SETTINGS_PANEL_POSITION}
            rotation={SETTINGS_PANEL_ROTATION}
            sections={decals}
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
