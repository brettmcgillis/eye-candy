import React from 'react';

import { Environment } from '@react-three/drei';

export default function SceneEnvironment() {
  // const controls = useControls('Environment', {}, { collapsed: true });
  return (
    <>
      {/* <color attach="background" args={['#000000']} /> */}
      <Environment background blur={1} preset="city" />
    </>
  );
}
