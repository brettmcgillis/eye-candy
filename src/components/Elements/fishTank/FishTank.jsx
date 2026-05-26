import React, { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

const GLASS_MATERIAL_KEYS = ['glass', 'glass_2', 'glass_5'];
export const FISH_TANK_PANE_KEYS = ['front', 'back', 'left', 'right'];

const GLASS_PANES = [
  { key: 'left', geometryKey: 'glass_left', materialKey: 'glass' },
  { key: 'front', geometryKey: 'glass_back', materialKey: 'glass' },
  { key: 'right', geometryKey: 'glass_right', materialKey: 'glass' },
  { key: 'back', geometryKey: 'glass_front', materialKey: 'glass' },
];

const STATIC_MESHES = [
  { geometryKey: 'rubber', materialKey: 'rubber' },
  { geometryKey: 'plastic_1', materialKey: 'plastic_1' },
  { geometryKey: 'rock_1', materialKey: 'rock_1' },
  { geometryKey: 'sand', materialKey: 'sand' },
  { geometryKey: 'rock_3', materialKey: 'rock_3' },
  { geometryKey: 'rock_4', materialKey: 'rock_4' },
  { geometryKey: 'rock_5', materialKey: 'rock_5' },
  { geometryKey: 'rock_6', materialKey: 'rock_6' },
  { geometryKey: 'rock_7', materialKey: 'rock_7' },
  { geometryKey: 'rock_2', materialKey: 'rock_2' },
  { geometryKey: 'stone', materialKey: 'stone' },
  { geometryKey: 'glass_2', materialKey: 'glass_2' },
  { geometryKey: 'glass_5', materialKey: 'glass_5' },
  { geometryKey: 'plastic_2', materialKey: 'plastic_1' },
  { geometryKey: 'lid_1', materialKey: 'plastic_1' },
];

export const FISH_TANK_STATIC_MESH_KEYS = STATIC_MESHES.map(
  ({ geometryKey }) => geometryKey
);

const FishTank = React.forwardRef(function FishTank(
  {
    glassColor,
    glassOpacity,
    paneProps = {},
    renderPane,
    renderStaticMesh,
    sandColor,
    staticMeshProps = {},
    ...props
  },
  ref
) {
  const { nodes, materials } = useGLTF(modelFile('/fishTank.glb'));
  const resolvedMaterials = useMemo(() => {
    const nextMaterials = Object.fromEntries(
      Object.entries(materials).map(([key, material]) => [
        key,
        material.clone(),
      ])
    );

    GLASS_MATERIAL_KEYS.forEach((key) => {
      const material = nextMaterials[key];

      if (!material) {
        return;
      }

      if (glassColor && material.color) {
        material.color.set(glassColor);
      }

      if (glassOpacity != null) {
        material.opacity = glassOpacity;
        material.transparent = glassOpacity < 1 || material.transparent;
        material.needsUpdate = true;
      }
    });

    if (sandColor && nextMaterials.sand?.color) {
      nextMaterials.sand.color.set(sandColor);
    }

    return nextMaterials;
  }, [glassColor, glassOpacity, materials, sandColor]);

  return (
    <group ref={ref} {...props} dispose={null}>
      {STATIC_MESHES.map(({ geometryKey, materialKey }) => {
        if (renderStaticMesh) {
          return renderStaticMesh({
            geometry: nodes[geometryKey].geometry,
            material: resolvedMaterials[materialKey],
            meshKey: geometryKey,
            meshProps: staticMeshProps[geometryKey],
          });
        }

        return (
          <mesh
            key={geometryKey}
            castShadow
            receiveShadow
            geometry={nodes[geometryKey].geometry}
            material={resolvedMaterials[materialKey]}
            {...staticMeshProps[geometryKey]}
          />
        );
      })}

      {GLASS_PANES.map(({ geometryKey, key, materialKey }) => {
        if (renderPane) {
          return renderPane({
            geometry: nodes[geometryKey].geometry,
            material: resolvedMaterials[materialKey],
            paneKey: key,
            paneProps: paneProps[key],
          });
        }

        return (
          <mesh
            key={key}
            castShadow
            receiveShadow
            geometry={nodes[geometryKey].geometry}
            material={resolvedMaterials[materialKey]}
            {...paneProps[key]}
          />
        );
      })}
    </group>
  );
});

FishTank.displayName = 'FishTank';

export default FishTank;

useGLTF.preload(modelFile('/fishTank.glb'));
