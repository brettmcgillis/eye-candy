import React, { memo } from 'react';

import {
  AccumulativeShadows,
  Environment,
  Html,
  RandomizedLight,
} from '@react-three/drei';

import { PaperFrame } from '@elements/Paperframe';
import { CameraRig } from '@modules/cameraRig';

import Relief from './components/Relief';
import Studio from './components/Studio';
import useComposition from './hooks/useComposition';
import useSceneControls from './hooks/useSceneControls';

function PaperCuts() {
  const [controls] = useSceneControls();
  const { frame, config, generated, error } = useComposition(controls);
  const { dataPosition, framePosition } = controls;

  return (
    <>
      <color attach="background" args={[controls.backgroundColor]} />
      <CameraRig camera={controls.camera} apiRef={controls.cameraApiRef} />
      {error ? (
        <Html center>
          <p role="alert">Invalid design: {error}</p>
        </Html>
      ) : null}
      {generated ? (
        <Studio
          config={config}
          position={dataPosition}
          scale={controls.dataScale}
        />
      ) : (
        <>
          <pointLight
            position={[3, 3, 5]}
            decay={0}
            distance={-1}
            intensity={0.8}
          />
          <AccumulativeShadows
            temporal
            frames={80}
            color="purple"
            colorBlend={0.5}
            opacity={1}
            scale={10}
            alphaTest={0.85}
          >
            <RandomizedLight
              amount={4}
              radius={5}
              ambient={0.5}
              position={[5, 3, 2]}
              bias={0.001}
            />
          </AccumulativeShadows>
          <Environment preset="city" blur={1} />
        </>
      )}
      <PaperFrame
        visible={controls.frameVisible}
        position={[framePosition.x, framePosition.y, framePosition.z]}
        scale={controls.frameScale}
        rotation={[0, 0, config.rotate ? 0 : -Math.PI / 4]}
        frameColor={controls.frameColor}
        frameRoughness={controls.frameRoughness}
        frameWatercolor={controls.frameWatercolor}
      />
      <group
        position={[dataPosition.x, dataPosition.y, dataPosition.z]}
        scale={controls.dataScale}
      >
        <Relief frame={frame} config={config} />
      </group>
    </>
  );
}
export default memo(PaperCuts);
