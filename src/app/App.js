import { useControls } from 'leva';
import React, { Suspense, useEffect, useMemo } from 'react';

import { Html } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import Loader from 'app/scaffold/loader/Loader';

import CRTTest from 'components/scenes/CRTTest/CrtTest';
import DumpsterFire from 'components/scenes/DumpsterFire/DumpsterFire';
import FoldedFrame from 'components/scenes/FoldedFrame/FoldedFrame';
import HandStuff from 'components/scenes/HandStuff/HandStuff';
import LoGlow from 'components/scenes/Loglow';
import NetworkTest from 'components/scenes/NetworkTest/NetworkTest';
import NewScene from 'components/scenes/NewScene';
import PaperStack from 'components/scenes/PaperStack/PaperStack';
import PixelHater from 'components/scenes/PixelHater/PixelHater';
import StrudelDoodle from 'components/scenes/StrudelDoodle/StrudelDoodle';

import './App.css';

const SCENES = {
  None: {
    Component: () => (
      <Html>
        <p>💀</p>
      </Html>
    ),
  },
  PixelHater: { Component: PixelHater },
  DumpsterFire: { Component: DumpsterFire },
  FoldedFrame: { Component: FoldedFrame },
  LoGlow: { Component: LoGlow },
  NewScene: { Component: NewScene },
  PaperStack: { Component: PaperStack },
  HandStuff: { Component: HandStuff },
  NetworkTest: { Component: NetworkTest },
  CrtTest: { Component: CRTTest },
  StrudelDoodle: { Component: StrudelDoodle },
};

/* ---------------------------------------------
   Query param helpers
---------------------------------------------- */

function getInitialScene() {
  const params = new URLSearchParams(window.location.search);
  const scene = params.get('scene');
  return scene && SCENES[scene] ? scene : 'None';
}

/* ---------------------------------------------
   App
---------------------------------------------- */

function App() {
  const initialScene = useMemo(getInitialScene, []);

  const { scene } = useControls('Scene Selection', {
    scene: {
      options: Object.keys(SCENES),
      value: initialScene,
    },
  });

  // write back to url when scene changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('scene', scene);
    window.history.replaceState({}, '', `?${params.toString()}`);
  }, [scene]);

  const SceneComponent = SCENES[scene]?.Component;

  return (
    <div className="App">
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, depth: true, debug: true }}
      >
        <Suspense fallback={<Loader />}>
          {SceneComponent && <SceneComponent />}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
