import * as THREE from 'three';

import React, { useCallback, useRef, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import FIRE_PRESETS from '../../../../../presets/fire/firePresets';
import Attractors from '../../../../elements/attractors/Attractors';
import GridBox from '../../../../elements/gridbox/GridBox';
import HotBoxSplineGroup from './components/SplineGroup';
import useHotBoxControls from './hooks/useHotBoxControls';

const DEFAULT_PRESET_KEY = Object.keys(FIRE_PRESETS)[0];
const DEFAULT_PRESET = FIRE_PRESETS[DEFAULT_PRESET_KEY];

export default function HotBox() {
  const [splines, setSplines] = useState(() =>
    DEFAULT_PRESET.splines.map((s) =>
      s.points.map((pt) => ({
        position: pt.position.clone(),
        rotation: pt.rotation.clone(),
        scale: pt.scale ? pt.scale.clone() : new THREE.Vector3(1, 1, 1),
      }))
    )
  );

  const setSplinePoints = useCallback((splineIndex, updater) => {
    setSplines((prev) =>
      prev.map((pts, i) => {
        if (i !== splineIndex) return pts;
        return typeof updater === 'function' ? updater(pts) : updater;
      })
    );
  }, []);

  const attractorsRef = useRef([]);

  const config = useHotBoxControls(splines, setSplines, attractorsRef);

  return (
    <>
      <color attach="background" args={[config.bgColor ?? '#ffffff']} />

      <PerspectiveCamera
        makeDefault
        position={[0, 250, 1000]}
        fov={70}
        near={1}
        far={10000}
      />

      <ambientLight intensity={3} color={0xf0f0f0} />
      <spotLight
        position={[0, 1500, 200]}
        angle={Math.PI * 0.2}
        intensity={4.5}
        decay={0}
        castShadow
        shadow-camera-near={200}
        shadow-camera-far={2000}
        shadow-bias={-0.000222}
        shadow-mapSize={[1024, 1024]}
      />

      <GridBox
        bgColor={config.bgColor ?? '#ffffff'}
        lineColor="#d1d1d1"
        lineWidth={0.02}
      />

      <OrbitControls makeDefault dampingFactor={0.2} />

      {/* eslint-disable react/no-array-index-key */}
      {splines.map((points, index) => (
        <HotBoxSplineGroup
          key={index}
          index={index}
          points={points}
          config={config}
          splineConfig={config.splineConfigs[index] ?? {}}
          attractorsRef={attractorsRef}
          setSplinePoints={setSplinePoints}
        />
      ))}
      {/* eslint-enable react/no-array-index-key */}

      <Attractors
        attractorsRef={attractorsRef}
        mode={config.attractorMode}
        visible={config.showAttractors}
        version={config.attractorVersion}
      />
    </>
  );
}
