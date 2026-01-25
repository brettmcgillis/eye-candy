import { useControls } from 'leva';
import React, { Suspense } from 'react';

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

import './App.css';

function App() {
  const { scene } = useControls('Scene Selection', {
    scene: {
      options: {
        None: 'None',
        PixelHater: 'PixelHater',
        DumpsterFire: 'DumpsterFire',
        FoldedFrame: 'FoldedFrame',
        LoGlow: 'LoGlow',
        NewScene: 'NewScene',
        PaperStack: 'PaperStack',
        HandStuff: 'HandStuff',
        NetworkTest: 'NetworkTest',
        CrtTest: 'CrtTest',
      },
      value: 'None',
    },
  });

  return (
    <div className="App">
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, depth: true, debug: true }}
      >
        <Suspense fallback={<Loader />}>
          {scene === 'None' && (
            <Html>
              <p>💀</p>
            </Html>
          )}
          {scene === 'PixelHater' && <PixelHater />}
          {scene === 'DumpsterFire' && <DumpsterFire />}
          {scene === 'FoldedFrame' && <FoldedFrame />}
          {scene === 'LoGlow' && <LoGlow />}
          {scene === 'NewScene' && <NewScene />}
          {scene === 'PaperStack' && <PaperStack />}
          {scene === 'HandStuff' && <HandStuff />}
          {scene === 'NetworkTest' && <NetworkTest />}
          {scene === 'CrtTest' && <CRTTest />}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
