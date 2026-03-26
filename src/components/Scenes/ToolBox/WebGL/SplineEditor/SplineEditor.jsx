import React, { useCallback, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import GridBox from '../../../../elements/gridbox/GridBox';
import SPLINE_PRESETS from '../../../../elements/spline/splinePresets';
import SplineGroup from './components/SplineGroup';
import useSplineEditorControls from './hooks/useSplineEditorControls';

export default function SplineEditor() {
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

  const config = useSplineEditorControls(splines, setSplines);

  return (
    <>
      <color attach="background" args={['#3a4a5c']} />

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

      <GridBox bgColor="#3a4a5c" lineColor="#1a2330" lineWidth={0.025} />

      <OrbitControls makeDefault dampingFactor={0.2} />

      {/* eslint-disable react/no-array-index-key */}
      {splines.map((points, index) => (
        <SplineGroup
          key={index}
          index={index}
          points={points}
          config={config}
          splineConfig={config.splineConfigs[index] ?? {}}
          setSplinePoints={setSplinePoints}
        />
      ))}
      {/* eslint-enable react/no-array-index-key */}
    </>
  );
}
