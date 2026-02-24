/* eslint-disable no-plusplus */
import { useControls } from 'leva';
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { OrbitControls, PerspectiveCamera, Splat } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import { imageFile, modelFile } from '../../../utils/appUtils';
import SparkSplatRenderer from './SparkRenderer';
import SparkSplat from './SparkSplat';
import useSplatDataTexture from './useSplatDataTexture';

export default function Rosie() {
  const render = useControls(
    'Render',
    { useSpark: { value: true } },
    { collapsed: true }
  );
  const controls = useControls(
    'Splat',
    {
      maxStdDev: { value: 1.5, min: 0, max: 2 },
      focalDistance: { value: 4.0, min: 0, max: 10 },
      near: { value: 1, min: 0, max: 5 },
      far: { value: 15, min: 10, max: 20 },
      mid: { value: 5, min: 5, max: 10 },
    },
    { collapsed: true }
  );

  const cameraRef = useRef();
  const controlsRef = useRef();
  const { camera } = useThree();

  // --- SPLATS ------------------------------------------------
  const splats = useMemo(
    () => [
      {
        id: 0,
        src: 'rosie_1.splat',
        position: new THREE.Vector3(-0.5, 0, 0),
        rotation: [0, Math.PI / 4, 0],
      },
      {
        id: 1,
        src: 'rosie_2.splat',
        position: new THREE.Vector3(0, 0, -1),
        rotation: [0, 0, 0],
      },
      {
        id: 2,
        src: 'rosie_3.splat',
        position: new THREE.Vector3(0.5, 0, 0),
        rotation: [0, -Math.PI / 4, 0],
      },
    ],
    []
  );

  // --- DEFAULT CAMERA TARGET --------------------------------
  const defaultTarget = useMemo(
    () => ({
      position: new THREE.Vector3(0, 0, 1),
      lookAt: splats[1].position.clone(),
    }),
    [splats]
  );

  // --- CAMERA STATE -----------------------------------------
  const targetPosition = useRef(defaultTarget.position.clone());
  const targetLookAt = useRef(defaultTarget.lookAt.clone());

  const activeIndexRef = useRef(-1); // authoritative index
  const [, forceRender] = useState(0); // optional: debugging / future UI

  const isAuto = useRef(true);

  // --- CAMERA ANIMATION -------------------------------------
  useFrame((_, delta) => {
    if (!isAuto.current) return;

    camera.position.lerp(targetPosition.current, 1 - Math.exp(-delta * 6));

    if (controlsRef.current) {
      controlsRef.current.target.lerp(
        targetLookAt.current,
        1 - Math.exp(-delta * 6)
      );
      controlsRef.current.update();
    } else {
      camera.lookAt(targetLookAt.current);
    }
  });

  // --- FOCUS LOGIC ------------------------------------------
  const focusSplat = (index) => {
    isAuto.current = true;

    if (index < 0) {
      targetPosition.current.copy(defaultTarget.position);
      targetLookAt.current.copy(defaultTarget.lookAt);
      activeIndexRef.current = -1;
      forceRender((v) => v + 1);
      return;
    }

    const splat = splats[index];

    const offset = new THREE.Vector3(0, 0, 0.6);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), splat.rotation[1]);

    targetPosition.current.copy(splat.position).add(offset);
    targetLookAt.current.copy(splat.position);

    activeIndexRef.current = index;
    forceRender((v) => v + 1);
  };

  // --- SPACE BAR CYCLING ------------------------------------
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'Space') return;
      e.preventDefault();

      const count = splats.length;
      const next =
        activeIndexRef.current === -1 ? 0 : activeIndexRef.current + 1;

      const wrapped = next >= count ? -1 : next;
      focusSplat(wrapped);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [splats]);

  const splatDataTexture = useSplatDataTexture(imageFile('heart.png'));

  // --- RENDER -----------------------------------------------
  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={defaultTarget.position.toArray()}
        near={0.1}
        far={20}
      />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        onStart={() => {
          isAuto.current = false; // user takes control
        }}
      />

      <color attach="background" args={['#ffffff']} />

      {render.useSpark && (
        <SparkSplatRenderer {...controls} splatDataTexture={splatDataTexture}>
          {splats.map((splat, i) => (
            <SparkSplat
              key={splat.id}
              splat={splat.src}
              position={splat.position.toArray()}
              rotation={splat.rotation}
              onClick={() => focusSplat(i)}
            />
          ))}
        </SparkSplatRenderer>
      )}

      {!render.useSpark &&
        splats.map((splat, i) => (
          <Splat
            key={splat.id}
            src={modelFile(splat.src)}
            position={splat.position.toArray()}
            rotation={splat.rotation}
            onClick={() => focusSplat(i)}
          />
        ))}
    </>
  );
}
