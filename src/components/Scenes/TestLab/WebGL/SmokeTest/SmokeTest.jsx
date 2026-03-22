import React, { useRef, useState } from 'react';

import { PerspectiveCamera } from '@react-three/drei';

import SplineLine from '../../../ToolBox/WebGL/SplineEditor/components/SplineLine';
import SplinePoints from '../../../ToolBox/WebGL/SplineEditor/components/SplinePoints';
import SPLINE_PRESETS from '../../../ToolBox/WebGL/SplineEditor/presets/presets';
import SmokeAttractors from './SmokeAttractors';
import SmokeGridBox from './SmokeGridBox';
import SmokeParticles from './SmokeParticles';
import useSmokeTestControls from './useSmokeTestControls';

// 2 attractors sit ON the spline arc at arc midpoints (not at control points).
// 2 attractors are NEAR the arc, offset ~100u so they pull without pinning.
const INITIAL_ATTRACTORS = [
  { position: [313, 313, 205] }, // ON arc — midpoint of pt0→pt1 segment
  { position: [-270, 338, 205] }, // ON arc — midpoint of pt2→pt3 segment
  { position: [-184, 357, -58] }, // NEAR arc — offset from pt3→pt4 midpoint
  { position: [72, 273, 331] }, // NEAR arc — offset from pt1→pt2 midpoint
];

export default function SmokeTest() {
  const [points, setPoints] = useState(() =>
    SPLINE_PRESETS.Default.points.map((v) => v.clone())
  );

  const config = useSmokeTestControls(points, setPoints);
  const attractorsRef = useRef(INITIAL_ATTRACTORS.map((a) => ({ ...a })));

  return (
    <>
      <color attach="background" args={['#ffffff']} />

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

      <SmokeGridBox />

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

      <SmokeParticles
        points={points}
        config={config}
        attractorsRef={attractorsRef}
      />

      {/* SmokeAttractors reads orbit controls from the R3F store (makeDefault) */}
      <SmokeAttractors attractorsRef={attractorsRef} />
    </>
  );
}
