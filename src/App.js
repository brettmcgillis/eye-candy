import { useControls } from "leva";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";

import "./App.css";

import { _45_deg } from "./utils/constants";

import Loader from "./components/Loader/Loader";
import LightingRig from "./components/Rigging/LightingRig";
import GridHelper from "./components/Rigging/GridHelper";

import { HaloSet } from "./components/Elements/Halo";
import { Skull } from "./components/Elements/Skull";
import { Femur } from "./components/Elements/Femur";

function App() {
  const femur = useControls("Femur", {
    x: { value: 0, min: -360, max: 360, step: 1 },
    y: { value: 0, min: -360, max: 360, step: 1 },
    z: { value: -20, min: -360, max: 360, step: 1 },
  });

  return (
    <div className="App">
      <Canvas shadows>
        <Suspense fallback={<Loader />}>
          <GridHelper />
          <LightingRig />

          <HaloSet position={[0, 1.5, -1]} rotation={[_45_deg, 0, 0]} />
          <Skull position={[0, 0, 0]} scale={0.1} />
          <Femur
            position={[-3, -3, -0.5]}
            scale={0.75}
            rotation={[femur.x, femur.y, femur.z]}
          />

          <CameraControls makeDefault />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
