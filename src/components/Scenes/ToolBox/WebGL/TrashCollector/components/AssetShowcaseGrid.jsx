import * as THREE from 'three';

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { Text } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

import {
  ASSET_GRID_COLUMNS,
  ASSET_GRID_OPTIONS,
  ASSET_GRID_POSITION,
  ASSET_GRID_ROW_SPACING,
} from '../utils/sceneData';
import {
  getAssetGridCellPosition,
  getAssetShowcaseLabel,
} from '../utils/sceneUtils';

const SHOWCASE_BODY_POSITION = [0, 0.08, 0];
const SHOWCASE_BODY_ROTATION = [0, Math.PI / 6, 0];
const SHOWCASE_PANEL_SIZE = [1.9, 0.08, 1.9];
const SHOWCASE_LABEL_PLATE_SIZE = [1.55, 0.012, 0.46];
const SHOWCASE_LABEL_PLATE_POSITION = [0, 0.087, 0.58];
const SHOWCASE_LABEL_POSITION = [0, 0.102, SHOWCASE_LABEL_PLATE_POSITION[2]];
const FLAT_TEXT_ROTATION = [-Math.PI / 2, 0, 0];
const TITLE_BANNER_SIZE = [6.8, 0.08, 1.15];
const TITLE_BANNER_TEXT_Y = 0.104;
const TITLE_BANNER_FRONT_PADDING = 2.2;

function AssetShowcaseCell({ asset, onAssetPreview, position }) {
  const { Component } = asset;
  const anchorRef = useRef(null);
  const contentRef = useRef(null);
  const [measuredYOffset, setMeasuredYOffset] = useState(null);
  const label = getAssetShowcaseLabel(asset);

  const handleClick = useCallback(
    (event) => {
      if (!onAssetPreview) {
        return;
      }

      event.stopPropagation();
      onAssetPreview(asset.key);
    },
    [asset.key, onAssetPreview]
  );

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
    <group position={position} onClick={handleClick}>
      <mesh position={[0, SHOWCASE_PANEL_SIZE[1] / 2, 0]} receiveShadow>
        <boxGeometry args={SHOWCASE_PANEL_SIZE} />
        <meshStandardMaterial color="#f6f2ea" />
      </mesh>

      <mesh position={SHOWCASE_LABEL_PLATE_POSITION} receiveShadow>
        <boxGeometry args={SHOWCASE_LABEL_PLATE_SIZE} />
        <meshStandardMaterial color="#e9decd" />
      </mesh>

      {measuredYOffset == null ? (
        <group
          ref={anchorRef}
          position={SHOWCASE_BODY_POSITION}
          rotation={SHOWCASE_BODY_ROTATION}
          visible={false}
        >
          <group ref={contentRef} scale={asset.scale ?? 1}>
            <Component {...asset.componentProps} />
          </group>
        </group>
      ) : (
        <RigidBody
          type="fixed"
          colliders={asset.colliders ?? 'cuboid'}
          position={SHOWCASE_BODY_POSITION}
          rotation={SHOWCASE_BODY_ROTATION}
          friction={1.1}
          restitution={0.05}
        >
          <group position={[0, measuredYOffset, 0]} scale={asset.scale ?? 1}>
            <Component {...asset.componentProps} />
          </group>
        </RigidBody>
      )}

      <Text
        position={SHOWCASE_LABEL_POSITION}
        rotation={FLAT_TEXT_ROTATION}
        anchorX="center"
        anchorY="middle"
        color="#171717"
        fontSize={0.14}
        lineHeight={0.9}
        maxWidth={SHOWCASE_LABEL_PLATE_SIZE[0] - 0.18}
        textAlign="center"
        userData={{ camExcludeCollision: true }}
      >
        {label}
      </Text>
    </group>
  );
}

export default function AssetShowcaseGrid({
  onAssetPreview,
  position = ASSET_GRID_POSITION,
  title = 'Trash Collection',
}) {
  const rowCount = Math.ceil(ASSET_GRID_OPTIONS.length / ASSET_GRID_COLUMNS);
  const titleBannerPosition = [
    0,
    TITLE_BANNER_SIZE[1] / 2,
    ((rowCount - 1) / 2) * ASSET_GRID_ROW_SPACING + TITLE_BANNER_FRONT_PADDING,
  ];

  return (
    <group position={position}>
      <mesh position={titleBannerPosition} receiveShadow>
        <boxGeometry args={TITLE_BANNER_SIZE} />
        <meshStandardMaterial color="#efe3d0" />
      </mesh>

      <Text
        position={[
          titleBannerPosition[0],
          TITLE_BANNER_TEXT_Y,
          titleBannerPosition[2],
        ]}
        rotation={FLAT_TEXT_ROTATION}
        anchorX="center"
        anchorY="middle"
        color="#101010"
        fontSize={0.28}
        maxWidth={TITLE_BANNER_SIZE[0] - 0.5}
        textAlign="center"
        userData={{ camExcludeCollision: true }}
      >
        {title}
      </Text>

      {ASSET_GRID_OPTIONS.map((asset, index) => (
        <AssetShowcaseCell
          key={`asset-showcase-${asset.key}`}
          asset={asset}
          onAssetPreview={onAssetPreview}
          position={getAssetGridCellPosition(index)}
        />
      ))}
    </group>
  );
}
