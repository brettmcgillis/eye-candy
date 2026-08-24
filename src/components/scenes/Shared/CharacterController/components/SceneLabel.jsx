import React from 'react';

import { Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import Label3D from './Label3D';

export default function SceneLabel({ text, scale = 2, ...props }) {
  const { gl } = useThree();
  const isWebGPU = gl?.isWebGPURenderer === true;
  const maxWidth = 10;

  if (isWebGPU) {
    return <Label3D text={text} scale={scale} maxWidth={maxWidth} {...props} />;
  }

  return (
    <Text
      scale={scale * 0.25}
      color="black"
      maxWidth={maxWidth}
      textAlign="center"
      {...props}
      userData={{ camExcludeCollision: true }}
    >
      {text}
    </Text>
  );
}
