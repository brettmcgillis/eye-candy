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

import InteractiveTvController from './TVParts/InteractiveTvController';
import { TvInstances } from './TVParts/TvInstances';
import TestPanels from './TestPanels';

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
     Render
  ---------------------------------------------- */

  return (
    <group>
      <TvInstances>
        <InteractiveTvController
          position={[5, 1, -3]}
          rotation={[0, -Math.PI / 4, 0]}
          scale={10}
          defaultChannel="vhs"
          isTurnedOn={false}
        />

        <InteractiveTvController
          position={[0, 6.25, -5]}
          rotation={[0, 0, 0]}
          scale={10}
          defaultChannel="threeD"
        />

        <InteractiveTvController
          position={[-5, 1, -3]}
          rotation={[0, Math.PI / 4, 0]}
          scale={10}
          defaultChannel="terminal"
          isTurnedOn={false}
        />
      </TvInstances>

      <InteractiveReversal
        position={[0, 0, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <Reversal position={[-1, 0, 2]} rotation={[-Math.PI / 2, 0, 0]} />
      <Reversal position={[1, 0, 2]} rotation={[-Math.PI / 2, 0, 0]} />

      {/* <TestPanels /> */}

      <mesh position={[0, 0, 2]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <planeGeometry args={[20, 20]} />
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
