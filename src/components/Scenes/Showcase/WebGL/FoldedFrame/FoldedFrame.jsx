/* eslint-disable react/no-array-index-key */
import React, { useMemo, useRef } from 'react';

import {
  AccumulativeShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
  RandomizedLight,
} from '@react-three/drei';

import getColorsInRange from '../../../../../utils/colors';
import { fourtyFiveDegrees } from '../../../../../utils/math';
import PaperFrame from '../../../../elements/paperframe/PaperFrame';
import Layer from './components/Layer';
import useFrameLayers from './hooks/useFrameLayers';
import useSceneAnimation from './hooks/useSceneAnimation';
import useSceneControls from './hooks/useSceneControls';

function FoldedFrame() {
  const [controls] = useSceneControls();

  const {
    frame,
    rotate,
    backgroundColor,
    colorRangeStart,
    colorRangeEnd,
    dataScale,
    frameScale,
    dataPosition,
    frameVisible,
    framePosition,
    frameColor,
    frameRoughness,
    frameWatercolor,
    squareRoughness,
    squareMetalness,
    squareFlatShading,
    squareWatercolor,
    morseColor,
    morseEmissiveIntensity,
  } = controls;

  const { frameLayers, settings } = useFrameLayers(
    frame,
    colorRangeStart,
    colorRangeEnd
  );
  const {
    depthBuffer,
    colorRangeStart: animatedColorStart,
    colorRangeEnd: animatedColorEnd,
    highlightedLayerIndex,
    highlightedSquareIndex,
    highlightedIsMirror,
    morsePulseStrength,
  } = useSceneAnimation({ controls, frameLayers, settings });

  const renderFrameLayers = useMemo(() => {
    if (!animatedColorStart || !animatedColorEnd) return frameLayers;

    const colorGamut = getColorsInRange(
      animatedColorStart,
      animatedColorEnd,
      frameLayers.length
    );

    return frameLayers.map((layer, layerIndex) =>
      layer.map((square) => ({
        ...square,
        color: colorGamut[layerIndex],
      }))
    );
  }, [frameLayers, animatedColorStart, animatedColorEnd]);

  const groupRef = useRef();

  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      <ambientLight intensity={0} />
      <pointLight
        position={[3, 3, 5]}
        decay={0}
        distance={-1}
        intensity={0.8}
      />

      <PerspectiveCamera
        makeDefault
        position={[0, 1.1, 3]}
        rotation={[0, 0, 0]}
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
      <OrbitControls
        makeDefault
        target={[0, 1.1, 0]}
        enableDamping
        dampingFactor={0.08}
      />

      <group ref={groupRef}>
        <PaperFrame
          visible={frameVisible}
          position={[framePosition.x, framePosition.y, framePosition.z]}
          scale={frameScale}
          rotation={[0, 0, rotate ? 0 : -fourtyFiveDegrees]}
          frameColor={frameColor}
          frameRoughness={frameRoughness}
          frameWatercolor={frameWatercolor}
        />
        <group
          castShadow
          receiveShadow
          position={[dataPosition.x, dataPosition.y, dataPosition.z]}
          scale={dataScale}
          rotation={[0, 0, rotate ? -fourtyFiveDegrees : 0]}
        >
          {renderFrameLayers.map((layer, index) => (
            <Layer
              key={`layer-${index}`}
              layer={index}
              squares={layer}
              depth={-(index * settings.paperDepth * depthBuffer)}
              settings={settings}
              highlightedSquareIndex={
                highlightedLayerIndex === index ? highlightedSquareIndex : -1
              }
              highlightedIsMirror={
                highlightedLayerIndex === index ? highlightedIsMirror : false
              }
              highlightColor={morseColor}
              highlightEmissiveIntensity={morseEmissiveIntensity}
              highlightStrength={morsePulseStrength}
              squareRoughness={squareRoughness}
              squareMetalness={squareMetalness}
              squareFlatShading={squareFlatShading}
              squareWatercolor={squareWatercolor}
            />
          ))}
        </group>
      </group>
    </>
  );
}

export default FoldedFrame;
