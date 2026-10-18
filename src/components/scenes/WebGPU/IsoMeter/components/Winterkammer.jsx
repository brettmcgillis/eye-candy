import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { toHex } from '@modules/isoMeter';

import useWinterkammerCanvas from '../hooks/useWinterkammerCanvas';

const ORIGIN = new THREE.Vector3();

function Winterkammer({ config }) {
  const meshRef = useRef(null);
  const { piece, texture } = useWinterkammerCanvas(config);
  const material = useMemo(
    () => new THREE.MeshBasicNodeMaterial({ map: texture }),
    [texture]
  );
  useEffect(() => () => material.dispose(), [material]);
  useSceneBackdrop({ color: toHex(piece.background) });

  useFrame((state) => {
    const view = state.viewport.getCurrentViewport(state.camera, ORIGIN);
    meshRef.current?.scale.set(view.width, view.height, 1);
  });

  return (
    <mesh ref={meshRef} frustumCulled={false} material={material}>
      <planeGeometry />
    </mesh>
  );
}

export default memo(Winterkammer);
