import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";

import "./App.css";
import { _45_deg, _90_deg } from "./utils/constants";

import { GridHelper } from "./components/GridHelper";
import { HaloSet } from "./components/Halo";
import { Skull } from "./components/Skull";
import { Femur } from "./components/Femur";
import LightingRig from "./components/LightingRig";
import { useControls } from "leva";

function App() {
  const femur = useControls("Femur", {
    x: { value: 0, min: -360, max: 360, step: 1 },
    y: { value: 0, min: -360, max: 360, step: 1 },
    z: { value: -20, min: -360, max: 360, step: 1 },
  });
  // const skull = useControls("Skull", {});
  // const halo = useControls("Halo", {});

  return (
    <div className="App">
      <Canvas shadows>
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
      </Canvas>
    </div>
  );
}

export default App;
