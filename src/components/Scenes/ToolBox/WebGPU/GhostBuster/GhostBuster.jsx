import * as THREE from 'three';

import React, { useCallback, useRef } from 'react';

import {
  Environment,
  Lightformer,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import GhostCharacter from '../../../../elements/webgpu/ghost/GhostCharacter';
import { GridMaterial } from '../../../../materials/webGPU/gridMaterial';
import GhostPlacard from './components/GhostPlacard';
import useAnimationInput from './hooks/useAnimationInput';
import useSceneControls from './hooks/useSceneControls';

const orbitOffset = new THREE.Vector3();
const orbitSpherical = new THREE.Spherical();

export default function GhostBuster() {
  const ghostRef = useRef();
  const orbitRef = useRef();
  const orbitLightRef = useRef();
  const orbitLightformerRef = useRef();
  const {
    inputRef: animationInputRef,
    setAnimation,
    triggerJump,
  } = useAnimationInput();
  const { applyPresetByName, controls, presetOptions, selectedPreset } =
    useSceneControls(ghostRef, setAnimation, triggerJump);

  const selectedPresetRef = useRef(selectedPreset);
  selectedPresetRef.current = selectedPreset;

  const cyclePreset = useCallback(() => {
    const idx = presetOptions.indexOf(selectedPresetRef.current);
    const next = presetOptions[(idx + 1) % presetOptions.length];
    applyPresetByName(next);
  }, [applyPresetByName, presetOptions]);

  // Apply right-stick orbit, zoom, and next-preset
  useFrame((state, delta) => {
    const orbit = orbitRef.current;
    const input = animationInputRef.current;
    if (!orbit) return;

    // Orbit light
    if (controls.orbitLightEnabled) {
      const t = state.clock.elapsedTime * controls.orbitLightSpeed;
      const r = controls.orbitLightRadius;
      const midY = (controls.orbitLightMinY + controls.orbitLightMaxY) * 0.5;
      const ampY = (controls.orbitLightMaxY - controls.orbitLightMinY) * 0.5;
      const ox = Math.cos(t) * r;
      const oy = midY + Math.sin(t * 0.7) * ampY;
      const oz = Math.sin(t) * r;
      if (orbitLightRef.current) orbitLightRef.current.position.set(ox, oy, oz);
      if (orbitLightformerRef.current) {
        // Three.js applies envRotationY to the sampling direction, so pre-rotate the
        // Lightformer by envRotationY so the IBL reflection appears at the correct world position.
        const envRot = controls.envRotationY ?? 0;
        const cosR = Math.cos(envRot);
        const sinR = Math.sin(envRot);
        orbitLightformerRef.current.position.set(
          cosR * ox + sinR * oz,
          oy,
          -sinR * ox + cosR * oz
        );
      }
    }

    // Next preset (one-shot)
    if (input.nextPreset) {
      cyclePreset();
      input.nextPreset = false;
    }

    const hasOrbit = input.orbitX || input.orbitY;
    const hasZoom = input.zoom;
    if (!hasOrbit && !hasZoom) return;

    const { object: camera, target } = orbit;
    orbitOffset.copy(camera.position).sub(target);
    orbitSpherical.setFromVector3(orbitOffset);

    // Orbit
    if (hasOrbit) {
      const rotSpeed = 2;
      orbitSpherical.theta -= input.orbitX * rotSpeed * delta;
      orbitSpherical.phi += input.orbitY * rotSpeed * delta;
      orbitSpherical.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, orbitSpherical.phi)
      );
    }

    // Zoom
    if (hasZoom) {
      const zoomSpeed = 3;
      orbitSpherical.radius -= input.zoom * zoomSpeed * delta;
      orbitSpherical.radius = Math.max(
        0.5,
        Math.min(10, orbitSpherical.radius)
      );
    }

    orbitOffset.setFromSpherical(orbitSpherical);
    camera.position.copy(target).add(orbitOffset);
    camera.lookAt(target);
  });

  return (
    <>
      <color attach="background" args={[controls.bgColor]} />

      <PerspectiveCamera
        makeDefault
        position={[0, 1, 3.5]}
        fov={50}
        near={0.01}
        far={100}
      />
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enabled={controls.orbitEnabled}
      />

      <Environment
        background={false}
        environmentIntensity={controls.sceneEnvIntensity}
        rotation={[0, controls.envRotationY ?? 0, 0]}
        frames={controls.orbitLightEnabled ? Infinity : 1}
      >
        {/* Top */}
        <Lightformer form="rect" intensity={6} position={[0, 5, 0]} scale={[2, 2, 1]} target={[0, 0, 0]} />
        {/* Front left/right strips */}
        <Lightformer form="rect" intensity={5} position={[-2.5, 1, 5]} scale={[0.4, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={5} position={[2.5, 1, 5]} scale={[0.4, 5, 1]} target={[0, 0, 0]} />
        {/* Left/right side walls */}
        <Lightformer form="rect" intensity={3} position={[-5, 1, 0]} scale={[0.3, 5, 5]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} position={[5, 1, 0]} scale={[0.3, 5, 5]} target={[0, 0, 0]} />
        {/* Back strips */}
        <Lightformer form="rect" intensity={3} position={[-2.5, 1, -5]} scale={[0.4, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} position={[2.5, 1, -5]} scale={[0.4, 5, 1]} target={[0, 0, 0]} />
        {/* Bottom fill */}
        <Lightformer form="rect" intensity={0.8} position={[0, -3, 0]} scale={[3, 3, 1]} target={[0, 0, 0]} />
        {/* Orbit light — moving reflection in chrome */}
        {controls.orbitLightEnabled && (
          <Lightformer
            ref={orbitLightformerRef}
            form="circle"
            intensity={controls.orbitLightIntensity * 1.5}
            color={controls.orbitLightColor}
            scale={[0.25, 0.25, 1]}
            position={[0, 1, 0]}
          />
        )}
      </Environment>

      <ambientLight intensity={controls.ambientIntensity} />
      <spotLight
        position={[0, controls.spotHeight, 2]}
        intensity={controls.spotIntensity}
        angle={Math.PI * 0.3}
        decay={0}
      />

      {controls.orbitLightEnabled && (
        <pointLight
          ref={orbitLightRef}
          color={controls.orbitLightColor}
          intensity={controls.orbitLightIntensity}
          decay={2}
        >
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color={controls.orbitLightColor} />
          </mesh>
        </pointLight>
      )}

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
        innerColor={controls.innerColor || null}
        outerEmissiveColor={controls.outerEmissiveColor}
        outerEmissiveIntensity={controls.outerEmissiveIntensity}
        innerEmissiveColor={controls.innerEmissiveColor}
        innerEmissiveIntensity={controls.innerEmissiveIntensity}
        emissiveFalloff={controls.emissiveFalloff}
        emissiveCenterU={controls.emissiveCenterU}
        emissiveCenterV={controls.emissiveCenterV}
        eyeColor={controls.eyeColor}
        eyeIntensity={controls.eyeIntensity}
        cutoutRimColor={controls.cutoutRimColor}
        cutoutRimWidth={controls.cutoutRimWidth}
        cutoutRimOffset={controls.cutoutRimOffset}
        stiffness={controls.stiffness}
        dampening={controls.dampening}
        handSize={controls.handSize}
        handHeight={controls.handHeight}
        handSpacing={controls.handSpacing}
        handSpring={controls.handSpring}
        handTrail={controls.handTrail}
        cursorCollider={controls.cursorCollider}
        cursorRadius={controls.cursorRadius}
        collisionMargin={controls.collisionMargin}
        earLiftY={controls.earLiftY}
        earPushBack={controls.earPushBack}
        earSpread={controls.earSpread}
        earColliderRadius={controls.earColliderRadius}
        segmentsX={controls.clothSegments}
        segmentsY={controls.clothSegments}
        clothWidth={controls.clothWidth}
        clothHeight={controls.clothHeight}
        gravity={controls.gravity}
        windAmplitude={controls.windAmplitude}
        maxVelocity={controls.maxVelocity}
        debugColliders={controls.debugColliders}
        debugColor={controls.debugColor}
        debugAnchors={controls.debugAnchors}
        debugAnchorColor={controls.debugAnchorColor}
        debugWireframe={controls.debugWireframe}
        holeAmount={controls.holeAmount}
        edgeFade={controls.edgeFade}
        tatterEdge={controls.tatterEdge}
        smoothEdges={controls.smoothEdges}
        alphaScale={controls.alphaScale}
        alphaSeed={controls.alphaSeed}
        roughness={controls.roughness}
        metalness={controls.metalness}
        envMapIntensity={controls.envMapIntensity}
        clearcoat={controls.clearcoat}
        clearcoatRoughness={controls.clearcoatRoughness}
        innerRoughness={controls.innerRoughness ?? null}
        innerMetalness={controls.innerMetalness ?? null}
        opacity={controls.opacity}
        paused={controls.paused}
        groundLightColor={controls.groundLightColor}
        groundLightIntensity={controls.groundLightIntensity}
        groundLightAngle={controls.groundLightAngle}
        groundLightDistance={controls.groundLightDistance}
      />

      <GhostPlacard
        variantName={selectedPreset}
        clothSegments={controls.clothSegments}
        animationInputRef={animationInputRef}
        ghostRef={ghostRef}
        stiffness={controls.stiffness}
        dampening={controls.dampening}
        holeAmount={controls.holeAmount}
        tatterEdge={controls.tatterEdge}
        innerColor={controls.innerColor}
        innerEmissive={controls.innerEmissiveColor}
        innerIntensity={controls.innerEmissiveIntensity}
        innerFalloff={controls.emissiveFalloff}
        outerColor={controls.color}
        outerEmissive={controls.outerEmissiveColor}
        outerIntensity={controls.outerEmissiveIntensity}
        outerFalloff={controls.emissiveFalloff}
        roughness={controls.roughness}
        metalness={controls.metalness}
      />

      {controls.floorVisible && (
        <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
