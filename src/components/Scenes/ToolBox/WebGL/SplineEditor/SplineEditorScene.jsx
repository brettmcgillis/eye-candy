import React from 'react';

import { PerspectiveCamera } from '@react-three/drei';

import GridBox from '../../../../elements/gridbox/GridBox';
import SplineLine from '../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../elements/spline/SplinePoints';

export default function SplineEditorScene({ points, setPoints, config }) {
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
        color="#ff4444"
        visible={config.showUniform}
        arcSegments={config.arcSegments}
      />
      <SplineLine
        points={points}
        tension={config.tension}
        closed={config.closed}
        curveType="centripetal"
        color="#44ff88"
        visible={config.showCentripetal}
        arcSegments={config.arcSegments}
      />
      <SplineLine
        points={points}
        tension={config.tension}
        closed={config.closed}
        curveType="chordal"
        color="#4488ff"
        visible={config.showChordal}
        arcSegments={config.arcSegments}
      />
    </>
  );
}
