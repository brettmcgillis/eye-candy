import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { toHex } from '@modules/isoMeter';
import {
  VOXEL_PX,
  createVoxelMaterials,
  disposeMaterials,
} from '@modules/isoMeterRender';

import useVoxelBlockBuild from '../hooks/useVoxelBlockBuild';
import CAMERA from '../utils/camera';

function VoxelLattice({ config, onBuilt, piece, replay }) {
  const fitRef = useRef(null);
  const materials = useMemo(() => createVoxelMaterials(), []);
  useEffect(() => () => disposeMaterials(materials), [materials]);
  const group = useVoxelBlockBuild({
    config,
    materials,
    onBuilt,
    piece,
    replay,
  });

  const ink = config.paletteInk ? toHex(piece.ink) : config.inkColor;
  useEffect(() => {
    materials.outlines.color.set(ink);
    materials.lines.color.set(ink);
  }, [ink, materials]);

  useFrame(({ size }) => {
    const { height, width } = piece.reference;
    const pxPerRef = Math.min(size.width / width, size.height / height);
    const voxel =
      pxPerRef *
      (CAMERA.frustumHeight / size.height) *
      VOXEL_PX *
      (piece.unit ?? 1);
    const { i, j, k } = piece.center;
    fitRef.current?.scale.setScalar(voxel);
    fitRef.current?.position.set(-i * voxel, -j * voxel, -k * voxel);
    materials.outlines.linewidth = config.outlineWidth * pxPerRef;
    materials.lines.linewidth = config.lineWidth * pxPerRef;
    materials.outlines.visible =
      config.outlineMode !== 'none' && config.outlineWidth > 0;
    materials.lines.visible = config.lineWidth > 0;
  });

  return (
    <group ref={fitRef}>
      <primitive object={group} />
    </group>
  );
}

export default memo(VoxelLattice);
