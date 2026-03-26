import React, { useCallback, useRef, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import Attractors from '../../../../elements/attractors/Attractors';
import GridBox from '../../../../elements/gridbox/GridBox';
import SPLINE_PRESETS from '../../../../elements/spline/splinePresets';
import SmokeSplineGroup from './components/SplineGroup';
import useSmokeTestControls from './hooks/useSmokeTestControls';

export default function SmokeTest() {
  const [splines, setSplines] = useState(() => [
    SPLINE_PRESETS.Default.points.map((pt) => ({
      position: pt.position.clone(),
      rotation: pt.rotation.clone(),
    })),
  ]);

  const setSplinePoints = useCallback((splineIndex, updater) => {
    setSplines((prev) =>
      prev.map((pts, i) => {
        if (i !== splineIndex) return pts;
        return typeof updater === 'function' ? updater(pts) : updater;
      })
    );
  }, []);

  const attractorsRef = useRef([
    { position: [313, 313, 205], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [-270, 338, 205], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [-184, 357, -58], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [72, 273, 331], direction: [0, 1, 0], rotation: [0, 0, 0] },
  ]);

  const config = useSmokeTestControls(splines, setSplines, attractorsRef);

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
        <SmokeSplineGroup
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
