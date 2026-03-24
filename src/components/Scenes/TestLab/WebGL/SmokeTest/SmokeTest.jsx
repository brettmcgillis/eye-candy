import React, { useRef, useState } from 'react';

import { PerspectiveCamera } from '@react-three/drei';

import GridBox from '../../../../elements/gridbox/GridBox';
import SmokeParticles from '../../../../elements/smoke/SmokeParticles';
import SplineLine from '../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../elements/spline/SplinePoints';
import SPLINE_PRESETS from '../../../../elements/spline/splinePresets';
import SmokeAttractors from './SmokeAttractors';
import VolumetricSmokeParticles from './VolumetricSmokeParticles';
import useSmokeTestControls from './useSmokeTestControls';

export default function SmokeTest() {
  const [points, setPoints] = useState(() =>
    SPLINE_PRESETS.Default.points.map((v) => v.clone())
  );

  const config = useSmokeTestControls(points, setPoints);
  const attractorsRef = useRef([
    { position: [313, 313, 205], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [-270, 338, 205], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [-184, 357, -58], direction: [0, 1, 0], rotation: [0, 0, 0] },
    { position: [72, 273, 331], direction: [0, 1, 0], rotation: [0, 0, 0] },
  ]);

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

      {/* SplinePoints renders its own OrbitControls with makeDefault */}
      <SplinePoints
        points={points}
        setPoints={setPoints}
        visible={config.showHelpers}
      />

      <SplineLine
        points={points}
        tension={config.tension}
        closed={config.closed}
        curveType="catmullrom"
        color="#aaaaaa"
        visible={config.showSpline}
        arcSegments={config.arcSegments}
      />

      {config.showClassicSmoke && (
        <SmokeParticles
          points={points}
          config={config}
          attractorsRef={attractorsRef}
        />
      )}

      {config.showVolSmoke && (
        <VolumetricSmokeParticles points={points} config={config} />
      )}

      {/* SmokeAttractors reads orbit controls from the R3F store (makeDefault) */}
      <SmokeAttractors attractorsRef={attractorsRef} />
    </>
  );
}
