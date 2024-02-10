import React, { Suspense } from 'react';

import { Canvas } from '@react-three/fiber';

import Loader from 'app/scaffold/loader/Loader';

// import FoldedFrame from 'components/scenes/FoldedFrame/FoldedFrame';
import LoGlow from 'components/scenes/Loglow';

// import NewScene from 'components/scenes/NewScene';
// import PaperStack from 'components/scenes/paperstack/PaperStack';
import './App.css';

function App() {
  return (
    <div className="App">
      <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
        <Suspense fallback={<Loader />}>
          {/* <FoldedFrame /> */}
          <LoGlow />
          {/* <NewScene /> */}
          {/* <PaperStack /> */}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
