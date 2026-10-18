import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { toHex } from '@modules/isoMeter';

import useLatticeBuild from '../hooks/useLatticeBuild';

const ORIGIN = new THREE.Vector3();

function Lattice({ config, onBuilt, piece, replay }) {
  const groupRef = useRef(null);
  const { fill, ink } = useLatticeBuild(piece, config, replay, onBuilt);

  const fillMaterial = useMemo(
    () =>
      new THREE.MeshBasicNodeMaterial({
        side: THREE.DoubleSide,
        vertexColors: true,
      }),
    []
  );
  const inkMaterial = useMemo(
    () => new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide }),
    []
  );

  const inkColor = config.paletteInk ? toHex(piece.ink) : config.inkColor;
  useEffect(() => {
    inkMaterial.color.set(inkColor);
  }, [inkColor, inkMaterial]);

  useEffect(
    () => () => {
      fillMaterial.dispose();
      inkMaterial.dispose();
    },
    [fillMaterial, inkMaterial]
  );
  useEffect(() => () => fill.dispose(), [fill]);
  useEffect(() => () => ink.dispose(), [ink]);

  useFrame((state) => {
    const view = state.viewport.getCurrentViewport(state.camera, ORIGIN);
    const { height, width } = piece.reference;
    const s = Math.min(view.width / width, view.height / height);
    groupRef.current?.scale.set(s, -s, 1);
  });

  return (
    <group ref={groupRef}>
      <mesh
        key={fill.uuid}
        frustumCulled={false}
        geometry={fill}
        material={fillMaterial}
      />
      <mesh
        key={ink.uuid}
        frustumCulled={false}
        geometry={ink}
        material={inkMaterial}
        position-z={0.01}
        visible={config.outlineWidth > 0 || config.lineWidth > 0}
      />
    </group>
  );
}

export default memo(Lattice);
