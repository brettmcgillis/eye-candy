import { useControls } from 'leva';
import React, { Suspense } from 'react';

import { Canvas } from '@react-three/fiber';

import Loader from 'app/scaffold/loader/Loader';

import DumpsterFire from 'components/scenes/DumpsterFire/DumpsterFire';
import FoldedFrame from 'components/scenes/FoldedFrame/FoldedFrame';
import LoGlow from 'components/scenes/Loglow';
import NewScene from 'components/scenes/NewScene';
import PaperStack from 'components/scenes/PaperStack/PaperStack';
import PixelHater from 'components/scenes/PixelHater/PixelHater';

import './App.css';

function App() {
  const { scene } = useControls('Scene Selection', {
    scene: {
      options: {
        PixelHater: 'PixelHater',
        DumpsterFire: 'DumpsterFire',
        FoldedFrame: 'FoldedFrame',
        LoGlow: 'LoGlow',
        NewScene: 'NewScene',
        PaperStack: 'PaperStack',
      },
      value: null,
    },
  });

  return (
    <div className="App">
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, depth: true, debug: true }}
      >
        <Suspense fallback={<Loader />}>
          {scene === 'PixelHater' && <PixelHater />}
          {scene === 'DumpsterFire' && <DumpsterFire />}
          {scene === 'FoldedFrame' && <FoldedFrame />}
          {scene === 'LoGlow' && <LoGlow />}
          {scene === 'NewScene' && <NewScene />}
          {scene === 'PaperStack' && <PaperStack />}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
