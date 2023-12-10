import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import "./App.css";
import { HaloSet } from "./components/Halo";
import { Skull } from "./components/Skull";
import { Femur } from "./components/Femur";

const _45_deg = Math.PI / 4;
const _90_deg = Math.PI / 2;

function App() {
  return (
    <div className="App">
      <Canvas shadows>
        <gridHelper rotation={[0, 0, 0]} />
        <gridHelper rotation={[0, 0, _90_deg]} />
        <gridHelper rotation={[_90_deg, 0, 0]} />

        <ambientLight intensity={1} />

        <HaloSet position={[0, 1.5, -1]} rotation={[_45_deg, 0, 0]} />
        <Skull position={[0, 0, 0]} scale={0.1} />
        <Femur position={[-3, -3, -0.5]} scale={0.75} rotation={[0, 0, 0]} />

        <CameraControls makeDefault />
      </Canvas>
    </div>
  );
}

export default App;
