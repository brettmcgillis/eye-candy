import * as THREE from 'three';

import React, {
  Children,
  cloneElement,
  isValidElement,
  useContext,
} from 'react';

import { createPortal } from '@react-three/fiber';

import MaskSceneContext from './MaskContext';

export default function PixelMask({ children }) {
  const maskScene = useContext(MaskSceneContext);
  if (!maskScene) return null;

  return createPortal(
    <group>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return null;

        return cloneElement(child, {
          material: new THREE.MeshBasicMaterial({ color: 'white' }),
        });
      })}
    </group>,
    maskScene
  );
}
