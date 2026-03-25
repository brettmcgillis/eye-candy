import React, { useMemo, useRef } from 'react';

import { CameraControls } from '@react-three/drei';

import Cube from './components/Cube';
import DoubleCube from './components/DoubleCube';
import DoublePlane from './components/DoublePlane';
import DoubleSphere from './components/DoubleSphere';
import Plane from './components/Plane';
import Sphere from './components/Sphere';
import useSceneControls from './hooks/useSceneControls';

export default function ExplosionTest() {
  const latestResolvedSettingsRef = useRef({});
  const controls = useSceneControls(latestResolvedSettingsRef);
  latestResolvedSettingsRef.current = controls;

  const shaderProps = useMemo(
    () => ({
      explodeStrength: controls.explodeStrength,
      pointerRadius: controls.pointerRadius,
      falloff: controls.falloff,
      shakeAmount: controls.shakeAmount,
      shakeSpeed: controls.shakeSpeed,
      returnSpeed: controls.returnSpeed,
      motionBoost: controls.motionBoost,
      damping: controls.damping,
      showPointerRadiusDebug: controls.showPointerRadiusDebug,
    }),
    [
      controls.explodeStrength,
      controls.pointerRadius,
      controls.falloff,
      controls.shakeAmount,
      controls.shakeSpeed,
      controls.returnSpeed,
      controls.motionBoost,
      controls.damping,
      controls.showPointerRadiusDebug,
    ]
  );

  const materialProps = useMemo(
    () => ({
      materialType: controls.materialType,
      color: controls.color,
      roughness: controls.roughness,
      metalness: controls.metalness,
      shininess: controls.shininess,
      specular: controls.specular,
      clearcoat: controls.clearcoat,
      clearcoatRoughness: controls.clearcoatRoughness,
      emissive: controls.emissive,
      emissiveIntensity: controls.emissiveIntensity,
      sheen: controls.sheen,
      sheenRoughness: controls.sheenRoughness,
      sheenColor: controls.sheenColor,
      iridescence: controls.iridescence,
      iridescenceIOR: controls.iridescenceIOR,
      flatShading: controls.flatShading,
      wireframe: controls.wireframe,
    }),
    [
      controls.materialType,
      controls.color,
      controls.roughness,
      controls.metalness,
      controls.shininess,
      controls.specular,
      controls.clearcoat,
      controls.clearcoatRoughness,
      controls.emissive,
      controls.emissiveIntensity,
      controls.sheen,
      controls.sheenRoughness,
      controls.sheenColor,
      controls.iridescence,
      controls.iridescenceIOR,
      controls.flatShading,
      controls.wireframe,
    ]
  );

  const glassProps = useMemo(
    () => ({
      glassColor: controls.glassColor,
      transmission: controls.transmission,
      thickness: controls.thickness,
      ior: controls.ior,
      chromaticAberration: controls.chromaticAberration,
    }),
    [
      controls.glassColor,
      controls.transmission,
      controls.thickness,
      controls.ior,
      controls.chromaticAberration,
    ]
  );

  const { columnSpacing, rowSpacing } = controls;

  return (
    <>
      <CameraControls />
      <ambientLight intensity={controls.ambientIntensity} />
      <directionalLight
        position={[3, 4, 6]}
        intensity={controls.directionalIntensity}
        color="#ffffff"
      />
      <pointLight position={[0, 6, -10]} intensity={1} color="#ffffff" />

      <color attach="background" args={[controls.backgroundColor]} />

      {/* Simple explodable shapes */}
      <Sphere
        position={[-columnSpacing, rowSpacing / 2, 0]}
        {...materialProps}
        {...shaderProps}
      />
      <Cube
        position={[0, rowSpacing / 2, 0]}
        {...materialProps}
        {...shaderProps}
      />
      <Plane
        position={[columnSpacing, rowSpacing / 2, 0]}
        {...materialProps}
        {...shaderProps}
      />

      {/* Compound shapes with glass cores */}
      <DoubleSphere
        position={[-columnSpacing, -rowSpacing / 2, 0]}
        {...materialProps}
        {...glassProps}
        {...shaderProps}
      />
      <DoubleCube
        position={[0, -rowSpacing / 2, 0]}
        {...materialProps}
        {...glassProps}
        {...shaderProps}
      />
      <DoublePlane
        position={[columnSpacing, -rowSpacing / 2, 0]}
        {...materialProps}
        {...glassProps}
        {...shaderProps}
      />
    </>
  );
}
