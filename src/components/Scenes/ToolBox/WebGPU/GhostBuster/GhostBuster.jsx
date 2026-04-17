import * as THREE from 'three';

import React, { useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import GhostCharacter from '../../../../elements/webgpu/ghost/GhostCharacter';
import { GridMaterial } from '../../../../materials/webGPU/gridMaterial';
import useAnimationInput from './hooks/useAnimationInput';
import useSceneControls from './hooks/useSceneControls';

export default function GhostBuster() {
  const ghostRef = useRef();
  const controls = useSceneControls(ghostRef);
  const animationInputRef = useAnimationInput();

  return (
    <>
      <color attach="background" args={[controls.bgColor]} />

      <PerspectiveCamera
        makeDefault
        position={[0, 0.3, 2.5]}
        fov={50}
        near={0.01}
        far={100}
      />
      <OrbitControls makeDefault enabled={controls.orbitEnabled} />

      <ambientLight intensity={controls.ambientIntensity} />
      <spotLight
        position={[0, controls.spotHeight, 2]}
        intensity={controls.spotIntensity}
        angle={Math.PI * 0.3}
        decay={0}
      />

      <GhostCharacter
        ref={ghostRef}
        animationInputRef={animationInputRef}
        bobAmplitude={controls.bobAmplitude}
        bobSpeed={controls.bobSpeed}
        swayAmplitude={controls.swayAmplitude}
        tiltIntensity={controls.tiltIntensity}
        baseWind={controls.baseWind}
        windBoostMul={controls.windBoostMul}
        squashIntensity={controls.squashIntensity}
        color={controls.color}
        eyeColor={controls.eyeColor}
        eyeIntensity={controls.eyeIntensity}
        stiffness={controls.stiffness}
        dampening={controls.dampening}
        handSize={controls.handSize}
        handSpacing={controls.handSpacing}
        handSpring={controls.handSpring}
        handTrail={controls.handTrail}
        cursorCollider={controls.cursorCollider}
        cursorRadius={controls.cursorRadius}
        gravity={controls.gravity}
        windAmplitude={controls.windAmplitude}
        maxVelocity={controls.maxVelocity}
        debugColliders={controls.debugColliders}
        debugColor={controls.debugColor}
        holeAmount={controls.holeAmount}
        edgeFade={controls.edgeFade}
        tatterEdge={controls.tatterEdge}
        alphaScale={controls.alphaScale}
        alphaSeed={controls.alphaSeed}
        roughness={controls.roughness}
        metalness={controls.metalness}
        opacity={controls.opacity}
        paused={controls.paused}
      />

      {controls.floorVisible && (
        <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <GridMaterial
            gridSize={controls.gridSize}
            lineWidth={controls.gridLineWidth}
            bgColor={new THREE.Color(controls.floorColor).toArray()}
            lineColor={new THREE.Color(controls.gridLineColor).toArray()}
            side={THREE.FrontSide}
          />
        </mesh>
      )}
    </>
  );
}
