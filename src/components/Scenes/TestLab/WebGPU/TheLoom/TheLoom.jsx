import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import ClothMesh from '../../../../elements/webgpu/cloth/ClothMesh';
import useTheLoomControls from './useTheLoomControls';

export default function TheLoom() {
  const clothRef = useRef();
  const { controls, pins, centered, cutouts } = useTheLoomControls();

  // Force full remount of ClothMesh when creation-only props change
  const simKey = useMemo(
    () =>
      `${controls.width}-${controls.height}-${controls.segmentsX}-${controls.segmentsY}-${controls.shapePreset}-${controls.pinMode}-${controls.orientation}`,
    [
      controls.width,
      controls.height,
      controls.segmentsX,
      controls.segmentsY,
      controls.shapePreset,
      controls.pinMode,
      controls.orientation,
    ]
  );

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 2]} fov={50} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={1} />
      <color attach="background" args={['#1a1a2e']} />
      <OrbitControls />
      {controls.sphereEnabled && controls.sphereVisible && (
        <mesh position={[controls.sphereX, controls.sphereY, controls.sphereZ]}>
          <sphereGeometry args={[controls.sphereRadius, 32, 32]} />
          <meshStandardMaterial color="#888888" transparent opacity={0.4} />
        </mesh>
      )}
      <ClothMesh
        key={simKey}
        ref={clothRef}
        width={controls.width}
        height={controls.height}
        segmentsX={controls.segmentsX}
        segmentsY={controls.segmentsY}
        pins={pins}
        centered={centered}
        orientation={controls.orientation}
        shape={controls.shapePreset}
        gravity={controls.gravity}
        stepsPerSecond={controls.stepsPerSecond}
        maxVelocity={controls.maxVelocity}
        wind={controls.wind}
        windDirX={controls.windDirX}
        windDirZ={controls.windDirZ}
        stiffness={controls.stiffness}
        dampening={controls.dampening}
        paused={controls.paused}
        cursorCollider={controls.cursorCollider}
        cursorRadius={controls.cursorRadius}
        colliders={
          controls.sphereEnabled
            ? [
                {
                  position: new THREE.Vector3(
                    controls.sphereX,
                    controls.sphereY,
                    controls.sphereZ
                  ),
                  radius: controls.sphereRadius,
                },
              ]
            : []
        }
        debugColliders={controls.debugColliders}
        debugColor={controls.debugColor}
        alphaSeed={controls.alphaSeed}
        alphaScale={controls.alphaScale}
        edgeFade={controls.edgeFade}
        holeAmount={controls.holeAmount}
        tatterEdge={controls.tatterEdge}
        cutouts={cutouts}
        materialProps={{
          color: controls.color,
          roughness: controls.roughness,
          metalness: controls.metalness,
          opacity: controls.opacity,
        }}
      />
    </>
  );
}
