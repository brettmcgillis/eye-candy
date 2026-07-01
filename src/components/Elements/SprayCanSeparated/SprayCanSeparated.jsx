import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

// Part keys -> glTF node names, shared with consumers that need direct
// geometry access for custom per-part behavior (e.g. WetPaint's draggable
// color-select sliders/wheel render these parts themselves and pass their
// keys in `hiddenParts` so this component skips them).
export const SPRAY_CAN_SEPARATED_NODE_KEYS = {
  bluePanel: 'blue_panel',
  blueSlider: 'blue_slider',
  canLabel: 'can_label',
  colorRing: 'color_ring',
  greenPanel: 'green_panel',
  greenSlider: 'green_slider',
  redPanel: 'red_panel',
  redSlider: 'red_slider',
  sprayCan: 'spray_can',
};

// Measured from the raw glTF (min Z across all parts is -4.638887...,
// before the -90deg-X rotation below maps raw +Z to world +Y) — the model's
// authored origin sits ~69% of the way up the can, not at its base. Every
// consumer positions this element assuming `position` is "where the base
// sits" (matching how the discarded/scattered instanced cans and the ground
// already work), so recenter once here rather than leaving every caller to
// rediscover and compensate for this offset.
export const CAN_BASE_RECENTER_Y = 4.638887405395508;
const PART_ROTATION = [-Math.PI / 2, 0, 0];

export default function SprayCanSeparated({
  hiddenParts,
  partMaterials,
  partRefs,
  ...props
}) {
  const { nodes, materials } = useGLTF(modelFile('sprayCanSeparated.glb'));
  const defaultMaterial = materials['default.001'];

  return (
    <group {...props} dispose={null}>
      <group position={[0, CAN_BASE_RECENTER_Y, 0]}>
        {Object.entries(SPRAY_CAN_SEPARATED_NODE_KEYS)
          .filter(([part]) => !hiddenParts?.includes(part))
          .map(([part, nodeKey]) => (
            <mesh
              key={part}
              ref={partRefs?.[part]}
              castShadow
              receiveShadow
              geometry={nodes[nodeKey].geometry}
              material={partMaterials?.[part] ?? defaultMaterial}
              rotation={PART_ROTATION}
            />
          ))}
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('sprayCanSeparated.glb'));
