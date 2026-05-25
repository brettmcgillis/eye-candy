import * as THREE from 'three';

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { Billboard, Text } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

import {
  ASSET_GRID_LABEL_HEIGHT,
  ASSET_GRID_OPTIONS,
  ASSET_GRID_POSITION,
} from '../utils/sceneData';
import {
  getAssetGridCellPosition,
  getAssetShowcaseLabel,
} from '../utils/sceneUtils';

const SHOWCASE_BODY_POSITION = [0, 0.08, 0];
const SHOWCASE_BODY_ROTATION = [0, Math.PI / 6, 0];

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
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[1.9, 0.08, 1.9]} />
        <meshStandardMaterial color="#f6f2ea" />
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

export default function AssetShowcaseGrid({
  onAssetPreview,
  position = ASSET_GRID_POSITION,
  title = 'Trash Collection',
}) {
  return (
    <group position={position}>
      <Billboard position={[0, 4.25, 0]}>
        <Text
          anchorX="center"
          anchorY="bottom"
          color="#101010"
          fontSize={0.38}
          outlineColor="#fbfaf6"
          outlineWidth={0.022}
          textAlign="center"
        >
          {title}
        </Text>
      </Billboard>

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
