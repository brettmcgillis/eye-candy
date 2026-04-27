import { Leva } from 'leva';

import { Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import { Bvh } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import { EcctrlJoystick } from '../src/EcctrlJoystick';
import Experience from './Experience';
import './style.css';

const root = ReactDOM.createRoot(document.querySelector('#root'));

const EcctrlJoystickControls = () => {
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    // Check if using a touch control device, show/hide joystick
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchScreen(true);
    } else {
      setIsTouchScreen(false);
    }
  }, []);
  return <>{isTouchScreen && <EcctrlJoystick buttonNumber={5} />}</>;
};

root.render(
  <>
    <Leva collapsed />
    <EcctrlJoystickControls />
    <Canvas
      shadows
      camera={{
        fov: 65,
        near: 0.1,
        far: 1000,
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse') {
          e.target.requestPointerLock();
        }
      }}
    >
      <Suspense fallback={null}>
        <Bvh firstHitOnly>
          <Experience />
        </Bvh>
      </Suspense>
    </Canvas>
  </>
);
