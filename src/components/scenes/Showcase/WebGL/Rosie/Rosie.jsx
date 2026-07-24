/* eslint-disable no-plusplus */
import { useControls } from 'leva';
import * as THREE from 'three';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { OrbitControls, PerspectiveCamera, Splat } from '@react-three/drei';
import { useFrame, useLoader, useThree } from '@react-three/fiber';

import { imageFile, modelFile } from '../../../../../utils/appUtils';
import CustomMultiSplat from './CustomMultiSplat';
import SparkMultiSplat from './SparkMultiSplat';
import useSplatDataTexture from './useSplatDataTexture';

export default function Rosie() {
  const render = useControls(
    'Rosie',
    {
      mode: {
        options: {
          Spark: 'spark',
          Drei: 'drei',
          'Custom Splat': 'customSplat',
        },
        value: 'drei',
      },
    },
    { collapsed: true }
  );
  const controlsRef = useRef();
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const setFrameloop = useThree((state) => state.setFrameloop);

  // --- SPLATS ------------------------------------------------
  const splats = useMemo(
    () => [
      {
        id: 0,
        src: 'rosie_1.splat',
        position: new THREE.Vector3(-0.5, 0, 0),
        positionArray: [-0.5, 0, 0],
        rotation: [0, Math.PI / 4, 0],
      },
      {
        id: 1,
        src: 'rosie_2.splat',
        position: new THREE.Vector3(0, 0, -1),
        positionArray: [0, 0, -1],
        rotation: [0, 0, 0],
      },
      {
        id: 2,
        src: 'rosie_3.splat',
        position: new THREE.Vector3(0.5, 0, 0),
        positionArray: [0.5, 0, 0],
        rotation: [0, -Math.PI / 4, 0],
      },
    ],
    []
  );

  // --- DEFAULT CAMERA TARGET --------------------------------
  const defaultTarget = useMemo(
    () => ({
      position: new THREE.Vector3(0, 0, 1),
      positionArray: [0, 0, 1],
      lookAt: splats[1].position.clone(),
    }),
    [splats]
  );

  // --- CAMERA STATE -----------------------------------------
  const targetPosition = useRef(defaultTarget.position.clone());
  const targetLookAt = useRef(defaultTarget.lookAt.clone());

  const activeIndexRef = useRef(-1); // authoritative index

  const isAuto = useRef(true);
  const isFreeRoam = useRef(false);
  const isDemandFrameloop = useRef(false);
  const modeWarmupFrames = useRef(0);
  const focusOffset = useRef(new THREE.Vector3(0, 0, 0.6));
  const rotationAxisY = useRef(new THREE.Vector3(0, 1, 0));
  const tmpOffset = useRef(new THREE.Vector3());
  const controlsLerp = 6;
  const maxLerpDelta = 1 / 30;
  const arriveThresholdSq = 0.0001;

  const invalidateIfDemand = useCallback(() => {
    if (!isDemandFrameloop.current) return;
    invalidate();
  }, [invalidate]);

  const splatUrls = useMemo(
    () => splats.map((splat) => modelFile(splat.src)),
    [splats]
  );
  const splatDataTexture = useSplatDataTexture(imageFile('heart-bw.png'));

  useLoader(THREE.FileLoader, splatUrls);

  useEffect(() => {
    isDemandFrameloop.current = render.mode !== 'spark';
    modeWarmupFrames.current = isDemandFrameloop.current ? 90 : 0;
    setFrameloop(isDemandFrameloop.current ? 'demand' : 'always');
    invalidate();

    return () => {
      setFrameloop('always');
    };
  }, [invalidate, render.mode, setFrameloop]);

  // --- CAMERA ANIMATION -------------------------------------
  useFrame((_, delta) => {
    if (modeWarmupFrames.current > 0) {
      modeWarmupFrames.current -= 1;
      invalidateIfDemand();
    }

    if (!isAuto.current) return;

    const clampedDelta = Math.min(delta, maxLerpDelta);
    const lerpAlpha = 1 - Math.exp(-clampedDelta * controlsLerp);
    camera.position.lerp(targetPosition.current, lerpAlpha);

    const orbitControls = controlsRef.current;
    if (orbitControls) {
      orbitControls.target.lerp(targetLookAt.current, lerpAlpha);
      orbitControls.update();
    } else {
      camera.lookAt(targetLookAt.current);
    }

    if (
      camera.position.distanceToSquared(targetPosition.current) <=
        arriveThresholdSq &&
      (!orbitControls ||
        orbitControls.target.distanceToSquared(targetLookAt.current) <=
          arriveThresholdSq)
    ) {
      isAuto.current = false;
      return;
    }

    invalidateIfDemand();
  });

  // --- FOCUS LOGIC ------------------------------------------
  const focusSplat = useCallback(
    (index) => {
      isFreeRoam.current = false;
      isAuto.current = true;

      if (index < 0) {
        targetPosition.current.copy(defaultTarget.position);
        targetLookAt.current.copy(defaultTarget.lookAt);
        activeIndexRef.current = -1;
        invalidateIfDemand();
        return;
      }

      const splat = splats[index];

      tmpOffset.current
        .copy(focusOffset.current)
        .applyAxisAngle(rotationAxisY.current, splat.rotation[1]);

      targetPosition.current.copy(splat.position).add(tmpOffset.current);
      targetLookAt.current.copy(splat.position);

      activeIndexRef.current = index;
      invalidateIfDemand();
    },
    [defaultTarget, invalidateIfDemand, splats]
  );

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
  }, [focusSplat, splats.length]);

  const splatClickHandlers = useMemo(
    () => splats.map((_, i) => () => focusSplat(i)),
    [focusSplat, splats]
  );

  // --- RENDER -----------------------------------------------
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={defaultTarget.positionArray}
        near={0.1}
        far={20}
      />

      <OrbitControls
        ref={controlsRef}
        enableDamping={false}
        onStart={() => {
          isFreeRoam.current = true;
          isAuto.current = false; // user takes control
          invalidateIfDemand();
        }}
        onChange={() => {
          if (isFreeRoam.current) invalidateIfDemand();
        }}
      />

      <color attach="background" args={['#ffffff']} />

      {render.mode === 'spark' && (
        <SparkMultiSplat
          splats={splats}
          splatClickHandlers={splatClickHandlers}
          splatDataTexture={splatDataTexture}
        />
      )}

      {render.mode === 'drei' &&
        splats.map((splat, i) => (
          <Splat
            key={splat.id}
            src={modelFile(splat.src)}
            position={splat.positionArray}
            rotation={splat.rotation}
            onClick={splatClickHandlers[i]}
          />
        ))}

      {render.mode === 'customSplat' && (
        <CustomMultiSplat
          splats={splats}
          splatClickHandlers={splatClickHandlers}
        />
      )}
    </>
  );
}
