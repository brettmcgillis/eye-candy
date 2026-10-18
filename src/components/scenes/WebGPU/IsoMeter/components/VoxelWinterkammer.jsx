import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import {
  WINTERKAMMER_LINE_WIDTH,
  toHex,
  winterkammerOutlineWidth,
} from '@modules/isoMeter';
import {
  VOXEL_PX,
  createVoxelMaterials,
  disposeMaterials,
  stageMatrix,
} from '@modules/isoMeterRender';

import useVoxelWinterkammer from '../hooks/useVoxelWinterkammer';
import CAMERA from '../utils/camera';

const setInk = (materials, [r, g, b]) => {
  materials.outlines.color.setRGB(
    r / 255,
    g / 255,
    b / 255,
    THREE.SRGBColorSpace
  );
  materials.lines.color.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
};

function VoxelWinterkammer({ config }) {
  const materials = useMemo(() => {
    const sets = {
      background: createVoxelMaterials(),
      tiles: createVoxelMaterials(),
    };
    return sets;
  }, []);
  useEffect(
    () => () => {
      disposeMaterials(materials.tiles);
      disposeMaterials(materials.background);
    },
    [materials]
  );
  const { piece, stage } = useVoxelWinterkammer({ ...config, materials });
  useEffect(() => {
    setInk(materials.tiles, piece.inks.final);
    setInk(materials.background, piece.inks.background);
  }, [materials, piece]);
  useSceneBackdrop({ color: toHex(piece.background) });

  useFrame(({ size }) => {
    const pxPerRef = Math.min(size.width, size.height) / piece.refSize;
    const scale = pxPerRef * (CAMERA.frustumHeight / size.height) * VOXEL_PX;
    stageMatrix(stage.stage.matrix, scale, piece);
    stage.stage.matrixWorldNeedsUpdate = true;
    const lineWidth = WINTERKAMMER_LINE_WIDTH * pxPerRef;
    materials.tiles.outlines.linewidth =
      winterkammerOutlineWidth(piece.baseZoom) * pxPerRef;
    materials.tiles.lines.linewidth = lineWidth;
    materials.background.outlines.linewidth = lineWidth;
    materials.background.lines.linewidth = lineWidth;
  });

  return <primitive object={stage.stage} />;
}

export default memo(VoxelWinterkammer);
