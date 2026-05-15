import * as THREE from 'three';

import React, { useMemo } from 'react';

import { Base, Geometry, Subtraction } from '@react-three/csg';

const WARM_LAYER_COLORS = [
  '#ffc14a',
  '#f18724',
  '#d95918',
  '#b63a15',
  '#8f2b15',
];

function createBackdropMaterials() {
  return {
    back: new THREE.MeshStandardMaterial({
      color: '#2220cc',
      roughness: 0.52,
      metalness: 0.08,
      emissive: new THREE.Color('#2220cc'),
      emissiveIntensity: 0.1,
    }),
    warm: WARM_LAYER_COLORS.map((color, index) => {
      const t = index / (WARM_LAYER_COLORS.length - 1);

      return new THREE.MeshStandardMaterial({
        color,
        roughness: THREE.MathUtils.lerp(0.78, 0.58, t),
        metalness: 0.05,
        emissive: new THREE.Color(color),
        emissiveIntensity: THREE.MathUtils.lerp(0.06, 0.18, t),
      });
    }),
  };
}

export default function BackdropRings({
  position = [0, 0, 0],
  outerRadius = 2.2,
  layerDepth = 0.18,
  layerGap = 0.06,
}) {
  const backDepth = layerDepth * 1.15;

  const layers = useMemo(() => {
    const smallestHoleRadius = outerRadius * 0.46;
    const largestHoleRadius = outerRadius * 0.9;

    return WARM_LAYER_COLORS.map((color, index) => ({
      color,
      holeRadius: THREE.MathUtils.lerp(
        smallestHoleRadius,
        largestHoleRadius,
        index / (WARM_LAYER_COLORS.length - 1)
      ),
      z: (index + 1) * (layerDepth + layerGap),
    }));
  }, [outerRadius, layerDepth, layerGap]);

  const backGeometry = useMemo(
    () => new THREE.CylinderGeometry(outerRadius, outerRadius, backDepth, 96),
    [outerRadius, backDepth]
  );

  const ringGeometry = useMemo(
    () => new THREE.CylinderGeometry(outerRadius, outerRadius, layerDepth, 96),
    [outerRadius, layerDepth]
  );

  const holeGeometries = useMemo(
    () =>
      layers.map(
        (layer) =>
          new THREE.CylinderGeometry(
            layer.holeRadius,
            layer.holeRadius,
            layerDepth * 4,
            96
          )
      ),
    [layers, layerDepth]
  );

  const materials = useMemo(() => createBackdropMaterials(), []);

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        geometry={backGeometry}
        material={materials.back}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {layers.map((layer, index) => (
        <mesh
          key={layer.color}
          castShadow
          receiveShadow
          material={materials.warm[index]}
          position={[0, 0, layer.z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <Geometry computeVertexNormals>
            <Base geometry={ringGeometry} />
            <Subtraction geometry={holeGeometries[index]} />
          </Geometry>
        </mesh>
      ))}
    </group>
  );
}
