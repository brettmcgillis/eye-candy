import './App.css';
import { Canvas } from '@react-three/fiber'

function App() {
  return (
    <div className="App">
      <Canvas>
        <ambientLight intensity={0.1} />
        <directionalLight color="red" position={[0, 0, 5]} />
        <mesh>
          <sphereGeometry />
          <meshPhysicalMaterial />
        </mesh>
      </Canvas>
    </div>
  );
}

export default App;
