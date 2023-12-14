import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";

import "./App.css";

import Loader from "../components/loader/Loader";
import LightingRig from "../components/rigging/LightingRig";
import ScreenShotControls from "../components/rigging/ScreenShot";

import NewScene from "../components/scenes/NewScene";
import Environment from "../components/rigging/Environment";

function App() {
  return (
    <div className="App">
      <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
        <Suspense fallback={<Loader />}>
          <LightingRig />
          <Environment />

          {/* <NewScene /> */}

          <CameraControls makeDefault />
          <ScreenShotControls />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
