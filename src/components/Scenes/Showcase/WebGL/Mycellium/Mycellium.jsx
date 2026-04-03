import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import MycelliumCloud from './components/MycelliumCloud';
import useMycelliumControls from './hooks/useMycelliumControls';
import useSceneControls from './hooks/useSceneControls';

// Cloud A — structured, filament-forming colony
const CLOUD_A_DEFAULTS = {
  // Simulation
  temperature: 0.8,
  equilibrium: 2.2,
  coherence: 0.9,
  scaleDepth: 0.45,
  freeEnergy: 1.0,
  boundRadius: 5,
  viscosity: 0.018,
  mass: 1.1,
  maxSpeed: 3.5,
  halfLife: 0.982,
  // Styling — deep red core fading to charcoal (blue in the reds prevents orange lerp)
  color1: '#717171',
  color2: '#980000',
  color3: '#3a3a3a',
  pointSize: 0.046,
  opacity: 1.0,
  // Behavior
  autoEvolve: true,
  glitchEnabled: true,
  pointCount: 150000,
  // Position
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  orbit: true,
  orbitRadius: 4,
  orbitSpeed: 0.12,
};

// Cloud B — diffuse, turbulent spore dispersal
const CLOUD_B_DEFAULTS = {
  // Simulation — opposing extremes from Cloud A
  temperature: 1.8,
  equilibrium: 0.6,
  coherence: 2.5,
  scaleDepth: 0.12,
  freeEnergy: 2.2,
  boundRadius: 5,
  viscosity: 0.006,
  mass: 0.8,
  maxSpeed: 6.0,
  halfLife: 0.975,
  // Styling — wine red to ash grey
  color1: '#ff0000',
  color2: '#b90000',
  color3: '#888888',
  pointSize: 0.038,
  opacity: 0.9,
  // Behavior
  autoEvolve: true,
  glitchEnabled: true,
  pointCount: 120000,
  // Position
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  orbit: true,
  orbitRadius: 4,
  orbitSpeed: 0.18,
};

export default function Mycellium() {
  const scene = useSceneControls();
  const [cloudA, setCloudA] = useMycelliumControls('Cloud A', CLOUD_A_DEFAULTS);
  const [cloudB, setCloudB] = useMycelliumControls('Cloud B', CLOUD_B_DEFAULTS);

  return (
    <>
      <color attach="background" args={[scene.background]} />
      <fog attach="fog" args={[scene.background, 0.015]} />
      <ambientLight intensity={0.4} />
      <PerspectiveCamera makeDefault position={[0, 10, 30]} fov={45} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        autoRotate={scene.autoRotate}
        autoRotateSpeed={scene.autoRotateSpeed}
      />
      <MycelliumCloud config={cloudA} setConfig={setCloudA} />
      <MycelliumCloud config={cloudB} setConfig={setCloudB} />
    </>
  );
}
