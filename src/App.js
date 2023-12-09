import './App.css';
import { Canvas } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei';

function App() {
  return (
    <div className="App">
      <Canvas shadows>
        <gridHelper />
        <ambientLight intensity={0.1} />
        <directionalLight color="red" position={[0, 0, 5]} />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshPhysicalMaterial />
        </mesh>
``      <CameraControls makeDefault />
      </Canvas>
    </div>
  );
}

export default App;
