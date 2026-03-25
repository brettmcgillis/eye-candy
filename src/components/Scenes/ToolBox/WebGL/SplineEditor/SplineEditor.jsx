import React, { useCallback, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import GridBox from '../../../../elements/gridbox/GridBox';
import SplineLine from '../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../elements/spline/SplinePoints';
import SPLINE_PRESETS from '../../../../elements/spline/splinePresets';
import useSplineEditorControls from './hooks/useSplineEditorControls';

function getSplineColors(splineIndex) {
  const hue = (splineIndex * 72) % 360;
  return {
    uniform: `hsl(${hue}, 75%, 55%)`,
    centripetal: `hsl(${(hue + 120) % 360}, 75%, 55%)`,
    chordal: `hsl(${(hue + 240) % 360}, 75%, 55%)`,
  };
}

function SplineGroup({ index, points, config, setSplinePoints }) {
  const setPoints = useCallback(
    (updater) => setSplinePoints(index, updater),
    [index, setSplinePoints]
  );
  const colors = getSplineColors(index);

  return (
    <>
      <SplinePoints
        points={points}
        setPoints={setPoints}
        visible={config.showPoints}
      />
      <SplineLine
        points={points}
        tension={config.tension}
        closed={config.closed}
        curveType="catmullrom"
        color={colors.uniform}
        visible={config.showUniform}
        arcSegments={config.arcSegments}
      />
      <SplineLine
        points={points}
        tension={config.tension}
        closed={config.closed}
        curveType="centripetal"
        color={colors.centripetal}
        visible={config.showCentripetal}
        arcSegments={config.arcSegments}
      />
      <SplineLine
        points={points}
        tension={config.tension}
        closed={config.closed}
        curveType="chordal"
        color={colors.chordal}
        visible={config.showChordal}
        arcSegments={config.arcSegments}
      />
    </>
  );
}

export default function SplineEditor() {
  const [splines, setSplines] = useState(() => [
    SPLINE_PRESETS.Default.points.map((v) => v.clone()),
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
          setSplinePoints={setSplinePoints}
        />
      ))}
      {/* eslint-enable react/no-array-index-key */}
    </>
  );
}
