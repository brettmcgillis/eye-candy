/* eslint-disable react/no-array-index-key */

/* eslint-disable no-unused-vars */

/* eslint-disable unused-imports/no-unused-imports */
// CrtTest.js
import { folder, useControls } from 'leva';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import {
  Environment,
  MeshReflectorMaterial,
  OrbitControls,
  PerspectiveCamera,
  Stats,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';

import Reversal, {
  InteractiveReversal,
} from 'components/elements/reversal/Reversal';

import CRTBlueScreenMaterial, {
  TerminalSetting,
  VHSSetting,
} from './CRTBlueScreenMaterial';
import CRTSceneInSceneMaterial from './CRTSceneInSceneMaterial';
import CRTSceneMaterial from './CRTSceneMaterial';
import CRTShowMaterial from './CRTShowMaterial';
import CRTSnowMaterial from './CRTSnowMaterial';
import CRTStaticMaterial from './CRTStaticMaterial';
import InteractiveTv from './InteractiveTv';
import TestScene from './TestScene';
import { InteractiveTvController } from './round2/InteractiveTvController';
import { TvInstances } from './round2/TvInstances';

export default function CRTTest() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 7, 11]} near={1} far={100} />
      <OrbitControls makeDefault minDistance={0} />
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[5, 6, 4]}
        intensity={0.2}
        lookAt={[0, 0, 0]}
      />
      <directionalLight
        position={[-5, 6, -4]}
        intensity={0.2}
        lookAt={[0, 0, 0]}
      />
      <Stats />
      <SeentIt />
      <RingLight />

      <color attach="background" args={['#000000']} />
      <Environment preset="city" />
      {/* <EffectComposer>
        <Bloom />
      </EffectComposer> */}
    </>
  );
}

function SeentIt() {
  /* ---------------------------------------------
     Config (matches your original layout)
  ---------------------------------------------- */

  const radius = 7; // how wide
  const height = 1;
  const arc = Math.PI * 0.6; // shallow semi arc
  const zOffset = 0.2; // pushes arc forward

  /* ---------------------------------------------
     Material registry
  ---------------------------------------------- */

  const materials = useMemo(
    () => [
      <meshStandardMaterial
        key="std"
        color="#616161"
        roughness={0}
        metalness={1}
      />,
      <CRTSnowMaterial key="snow" />,
      <CRTStaticMaterial key="static" />,
      <CRTBlueScreenMaterial key="terminal" {...TerminalSetting} />,
      <CRTBlueScreenMaterial key="vhs" {...VHSSetting} />,
      <CRTShowMaterial key="homeVideo" useWebcam />,
      <CRTShowMaterial key="tv" />,
      <CRTSceneMaterial key="triple-d" scene={<TestScene />} />,
      <CRTSceneInSceneMaterial key="pip" />,
    ],
    []
  );

  /* ---------------------------------------------
     Build TRUE circular concave arc
  ---------------------------------------------- */

  const panels = useMemo(() => {
    const count = materials.length;
    if (count === 1) {
      return [
        {
          position: [0, height, 0],
          rotation: [0, 0, 0],
          material: materials[0],
        },
      ];
    }

    return materials.map((mat, i) => {
      const t = i / (count - 1);

      // angle from left → right
      const theta = arc * (t - 0.5);

      // circular arc in XZ
      const x = Math.sin(theta) * radius;
      const z = -(Math.cos(theta) * radius) + radius + zOffset;

      // rotation matches arc
      const rotY = -theta;

      return {
        position: [x, height, z],
        rotation: [0, rotY, 0],
        material: mat,
      };
    });
  }, [materials, radius, height, arc, zOffset]);

  /* ---------------------------------------------
     Render
  ---------------------------------------------- */

  return (
    <group>
      {/* <InteractiveTv position={[0, 1, -3]} scale={10} /> */}

      <TvInstances>
        <InteractiveTvController
          position={[5, 1, -3]}
          rotation={[0, -Math.PI / 4, 0]}
          scale={10}
          defaultChannel="terminal"
        />
        <InteractiveTvController
          position={[-5, 1, -3]}
          rotation={[0, Math.PI / 4, 0]}
          scale={10}
        />
      </TvInstances>
      {/* {panels.map((panel, i) => (
        <mesh
          key={`panel-${i}`}
          position={panel.position}
          rotation={panel.rotation}
        >
          <planeGeometry args={[2, 2]} />
          {panel.material}
        </mesh>
      ))} */}

      <InteractiveReversal
        position={[0, 0, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <Reversal position={[-1, 0, 2]} rotation={[-Math.PI / 2, 0, 0]} />
      <Reversal position={[1, 0, 2]} rotation={[-Math.PI / 2, 0, 0]} />

      <mesh position={[0, 0, 2]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <planeGeometry args={[15, 15]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={2048}
          mixBlur={1}
          mixStrength={80}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#131313"
          metalness={1}
        />
      </mesh>
    </group>
  );
}

function RingLight() {
  return (
    <group>
      <directionalLight
        position={[0, 10, 0]}
        intensity={0.7}
        lookAt={[0, 0, 0]}
      />
      <directionalLight
        position={[0, 10, 0]}
        intensity={0.7}
        lookAt={[0, 1, -3]}
      />
      <mesh position={[0, 10, 5]} rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[5]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FFFFFF"
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}
