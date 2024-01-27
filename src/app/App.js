import React, { Suspense } from 'react';

import { Canvas } from '@react-three/fiber';

import Loader from 'components/loader/Loader';
// import FoldedFrame from 'components/scenes/FoldedFrame/FoldedFrame';
// import LoGlow from 'components/scenes/Loglow';
import NewScene from 'components/scenes/NewScene';

import './App.css';

function App() {
  return (
    <div className="App">
      <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
        <Suspense fallback={<Loader />}>
          {/* <FoldedFrame /> */}
          {/* <LoGlow /> */}
          <NewScene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
