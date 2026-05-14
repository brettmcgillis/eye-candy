import * as THREE from 'three';

import React, { useLayoutEffect, useRef, useState } from 'react';

import { Billboard, Text } from '@react-three/drei';

import {
  ASSET_GRID_COLUMNS,
  ASSET_GRID_LABEL_HEIGHT,
  ASSET_GRID_OPTIONS,
  ASSET_GRID_POSITION,
  ASSET_GRID_ROW_SPACING,
} from '../utils/sceneData';
import {
  getAssetGridCellPosition,
  getAssetShowcaseLabel,
} from '../utils/sceneUtils';

function AssetShowcaseCell({ asset, position }) {
  const { Component } = asset;
  const anchorRef = useRef(null);
  const contentRef = useRef(null);
  const [measuredYOffset, setMeasuredYOffset] = useState(0);
  const label = getAssetShowcaseLabel(asset);

  useLayoutEffect(() => {
    if (!anchorRef.current || !contentRef.current) {
      return;
    }

    const anchorPosition = new THREE.Vector3();
    const bounds = new THREE.Box3();

    anchorRef.current.updateWorldMatrix(true, true);
    contentRef.current.updateWorldMatrix(true, true);
    anchorRef.current.getWorldPosition(anchorPosition);
    bounds.setFromObject(contentRef.current);

    if (Number.isFinite(bounds.min.y)) {
      setMeasuredYOffset(
        anchorPosition.y - bounds.min.y + (asset.showcaseYOffset ?? 0)
      );
    }
  }, [asset]);

  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[1.9, 0.08, 1.9]} />
        <meshStandardMaterial color="#f6f2ea" />
      </mesh>

      <group
        ref={anchorRef}
        position={[0, 0.08, 0]}
        rotation={[0, Math.PI / 6, 0]}
      >
        <group
          ref={contentRef}
          position={[0, measuredYOffset, 0]}
          scale={asset.scale ?? 1}
        >
          <Component {...asset.componentProps} />
        </group>
      </group>

      <Billboard position={[0, ASSET_GRID_LABEL_HEIGHT, 0]}>
        <Text
          anchorX="center"
          anchorY="bottom"
          color="#171717"
          fontSize={0.24}
          lineHeight={1.18}
          maxWidth={2.4}
          outlineColor="#fbfaf6"
          outlineWidth={0.02}
          textAlign="center"
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

export default function AssetShowcaseGrid() {
  const titleOffsetZ =
    ((Math.ceil(ASSET_GRID_OPTIONS.length / ASSET_GRID_COLUMNS) - 1) / 2 +
      0.9) *
    ASSET_GRID_ROW_SPACING;

  return (
    <group position={ASSET_GRID_POSITION}>
      <Billboard position={[0, 3.25, titleOffsetZ]}>
        <Text
          anchorX="center"
          anchorY="bottom"
          color="#101010"
          fontSize={0.38}
          outlineColor="#fbfaf6"
          outlineWidth={0.022}
          textAlign="center"
        >
          Trash Collection
        </Text>
      </Billboard>

      {ASSET_GRID_OPTIONS.map((asset, index) => (
        <AssetShowcaseCell
          key={`asset-showcase-${asset.key}`}
          asset={asset}
          position={getAssetGridCellPosition(index)}
        />
      ))}
    </group>
  );
}
