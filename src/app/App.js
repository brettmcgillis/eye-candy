import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";

import "./App.css";

import Loader from "../components/loader/Loader";

import FoldedFrame from "../components/scenes/FoldedFrame/FoldedFrame";
import NewScene from "../components/scenes/NewScene";

function App() {
  return (
    <div className="App">
      <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
        <Suspense fallback={<Loader />}>
          {/* <FoldedFrame /> */}
          <NewScene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
