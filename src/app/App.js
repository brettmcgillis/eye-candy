import { Suspense } from 'react';

import { Canvas } from '@react-three/fiber';

import Loader from '../components/loader/Loader';
import FoldedFrame from '../components/scenes/FoldedFrame/FoldedFrame';
import LoGlow from '../components/scenes/Loglow';
import NewScene from '../components/scenes/NewScene';

import './App.css';

function App() {
  return (
    <div className="App">
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [-1, -1, 3.5] }}
      >
        <Suspense fallback={<Loader />}>
          {/* <FoldedFrame /> */}
          <NewScene />
          {/* <LoGlow /> */}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
