import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { PerspectiveCamera, Sky, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';

import { modelFile } from '../../../../../utils/appUtils';
import OceanMaterial, {
  sampleWaveHeight,
  sampleWaveNormal,
} from './OceanMaterial';
import useRowItAloneControls from './useRowItAloneControls';

// ---------- reusable quaternion / euler scratch ----------
const scratchEuler = new THREE.Euler();
const scratchQuat = new THREE.Quaternion();
const scratchVec3 = new THREE.Vector3();

function Ocean({ config }) {
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(120, 120, 200, 200),
    []
  );

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <OceanMaterial config={config} />
    </mesh>
  );
}

// --- Hull: kinematic body driven by wave sampling ---

function BoatHull({ config, nodes, materials }) {
  const bodyRef = useRef();
  const smoothY = useRef(0);
  const smoothPitch = useRef(0);
  const smoothRoll = useRef(0);

  const rotY = THREE.MathUtils.degToRad(config.boatRotY);

  useFrame(() => {
    const api = bodyRef.current;
    if (!api) return;

    const {
      boatX,
      boatZ,
      waveHeight,
      waveChoppiness,
      waveSpeed,
      boatBobSmooth,
      boatTiltAmount,
    } = config;

    const y = sampleWaveHeight(
      boatX,
      boatZ,
      waveHeight,
      waveChoppiness,
      waveSpeed
    );
    const n = sampleWaveNormal(
      boatX,
      boatZ,
      waveHeight,
      waveChoppiness,
      waveSpeed
    );

    const lerp = boatBobSmooth;
    smoothY.current += (y - smoothY.current) * lerp;
    smoothPitch.current +=
      (-Math.atan2(n.z, n.y) * boatTiltAmount - smoothPitch.current) * lerp;
    smoothRoll.current +=
      (Math.atan2(n.x, n.y) * boatTiltAmount - smoothRoll.current) * lerp;

    scratchVec3.set(boatX, smoothY.current, boatZ);
    api.setNextKinematicTranslation(scratchVec3);

    scratchEuler.set(smoothPitch.current, rotY, smoothRoll.current, 'YXZ');
    scratchQuat.setFromEuler(scratchEuler);
    api.setNextKinematicRotation(scratchQuat);
  });

  const s = config.boatScale;

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders="hull"
      position={[config.boatX, 0, config.boatZ]}
      scale={[s, s, s]}
      rotation={[0, rotY, 0]}
    >
      <mesh
        name="hull_mesh"
        castShadow
        receiveShadow
        geometry={nodes.hull_mesh.geometry}
        material={materials.rowboat_1}
      />
      <mesh
        name="front_bench_mesh"
        castShadow
        receiveShadow
        geometry={nodes.front_bench_mesh.geometry}
        material={materials.rowboat_2}
      />
      <mesh
        name="middle_bench_mesh"
        castShadow
        receiveShadow
        geometry={nodes.middle_bench_mesh.geometry}
        material={materials.rowboat_2}
      />
      <mesh
        name="rear_bench_mesh"
        castShadow
        receiveShadow
        geometry={nodes.rear_bench_mesh.geometry}
        material={materials.rowboat_2}
      />
      <mesh
        name="horizontal_support_strips_mesh"
        castShadow
        receiveShadow
        geometry={nodes.horizontal_support_strips_mesh.geometry}
        material={materials.rowboat_1}
      />
      <mesh
        name="support_strips_mesh"
        castShadow
        receiveShadow
        geometry={nodes.support_strips_mesh.geometry}
        material={materials.rowboat_1}
      />
      <mesh
        name="upper_edge_mesh"
        castShadow
        receiveShadow
        geometry={nodes.upper_edge_mesh.geometry}
        material={materials.rowboat_2}
      />
    </RigidBody>
  );
}

// --- Oar: dynamic body with locked translations (pinned to boat) ---
// enabledRotations allows pitch (rowing stroke) but locks yaw / roll
// so the oars stay attached to the hull but can rock with the waves.

function Oar({ config, oarGeometry, lockGeometry, oarMaterial, side }) {
  const bodyRef = useRef();
  const smoothY = useRef(0);
  const smoothPitch = useRef(0);
  const smoothRoll = useRef(0);

  const rotY = THREE.MathUtils.degToRad(config.boatRotY);

  useFrame(() => {
    const api = bodyRef.current;
    if (!api) return;

    const {
      boatX,
      boatZ,
      waveHeight,
      waveChoppiness,
      waveSpeed,
      boatBobSmooth,
      boatTiltAmount,
    } = config;

    const y = sampleWaveHeight(
      boatX,
      boatZ,
      waveHeight,
      waveChoppiness,
      waveSpeed
    );
    const n = sampleWaveNormal(
      boatX,
      boatZ,
      waveHeight,
      waveChoppiness,
      waveSpeed
    );

    const lerp = boatBobSmooth;
    smoothY.current += (y - smoothY.current) * lerp;
    smoothPitch.current +=
      (-Math.atan2(n.z, n.y) * boatTiltAmount - smoothPitch.current) * lerp;
    smoothRoll.current +=
      (Math.atan2(n.x, n.y) * boatTiltAmount - smoothRoll.current) * lerp;

    scratchVec3.set(boatX, smoothY.current, boatZ);
    api.setNextKinematicTranslation(scratchVec3);

    scratchEuler.set(smoothPitch.current, rotY, smoothRoll.current, 'YXZ');
    scratchQuat.setFromEuler(scratchEuler);
    api.setNextKinematicRotation(scratchQuat);
  });

  const s = config.boatScale;
  const meshName = `${side}_oar_mesh`;
  const lockName = `${side}_oar_lock_mesh`;

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders="hull"
      position={[config.boatX, 0, config.boatZ]}
      scale={[s, s, s]}
      rotation={[0, rotY, 0]}
    >
      <mesh
        name={meshName}
        castShadow
        receiveShadow
        geometry={oarGeometry}
        material={oarMaterial}
      />
      <mesh
        name={lockName}
        castShadow
        receiveShadow
        geometry={lockGeometry}
        material={oarMaterial}
      />
    </RigidBody>
  );
}

// --- Composed boat with separate physics bodies per part ---

function FloatingBoat({ config }) {
  const { nodes, materials } = useGLTF(modelFile('/rowboat.glb'));

  return (
    <>
      <BoatHull config={config} nodes={nodes} materials={materials} />
      <Oar
        config={config}
        oarGeometry={nodes.left_oar_mesh.geometry}
        lockGeometry={nodes.left_oar_lock_mesh.geometry}
        oarMaterial={materials.rowboat_2}
        side="left"
      />
      <Oar
        config={config}
        oarGeometry={nodes.right_oar_mesh.geometry}
        lockGeometry={nodes.right_oar_lock_mesh.geometry}
        oarMaterial={materials.rowboat_2}
        side="right"
      />
    </>
  );
}

function SunLight({ config }) {
  const phi = THREE.MathUtils.degToRad(90 - config.skyElevation);
  const theta = THREE.MathUtils.degToRad(config.skyAzimuth);
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);

  return (
    <directionalLight
      color="#ffe8c0"
      intensity={3}
      position={[sunDir.x * 30, sunDir.y * 30, sunDir.z * 30]}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-near={0.5}
      shadow-camera-far={80}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
    />
  );
}

function SceneContents({ config }) {
  const sunPosition = useMemo(() => {
    const phi = THREE.MathUtils.degToRad(90 - config.skyElevation);
    const theta = THREE.MathUtils.degToRad(config.skyAzimuth);
    return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
  }, [config.skyElevation, config.skyAzimuth]);

  return (
    <>
      <color attach="background" args={[config.fogColor]} />
      <fog
        attach="fog"
        args={[config.fogColor, config.fogNear, config.fogFar]}
      />

      <PerspectiveCamera
        makeDefault
        position={[4, 1.8, 8]}
        fov={50}
        near={0.1}
        far={500}
        onUpdate={(self) => self.lookAt(0, 0.2, 0)}
      />

      <ambientLight intensity={0.4} color="#b0c4de" />
      <SunLight config={config} />

      <Sky
        distance={450000}
        sunPosition={sunPosition}
        turbidity={config.skyTurbidity}
        rayleigh={config.skyRayleigh}
        mieCoefficient={config.skyMieCoefficient}
        mieDirectionalG={config.skyMieDirectionalG}
        inclination={undefined}
        azimuth={undefined}
      />

      <Ocean config={config} />
      <FloatingBoat config={config} />
    </>
  );
}

export default function RowItAlone() {
  const config = useRowItAloneControls();

  return (
    <Physics gravity={[0, -9.81, 0]}>
      <SceneContents config={config} />
    </Physics>
  );
}
