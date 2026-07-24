/* eslint-disable no-underscore-dangle */
import React, { forwardRef } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

const Flower = forwardRef(function Flower({ count = 1, ...props }, ref) {
  const { nodes, materials } = useGLTF(modelFile('flower.glb'));
  return (
    <instancedMesh
      ref={ref}
      args={[nodes._ndyj_Var10_LOD0.geometry, materials.material0, count]}
      castShadow
      receiveShadow
      {...props}
    />
  );
});

export default Flower;

useGLTF.preload(modelFile('flower.glb'));
