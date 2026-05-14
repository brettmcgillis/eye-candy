import * as THREE from 'three';

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Billboard,
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Text,
  useGLTF,
} from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import {
  CuboidCollider,
  InstancedRigidBodies,
  Physics,
  RigidBody,
} from '@react-three/rapier';

import AudioToggleOverlay from '../../../../../app/scaffold/overlay/components/AudioToggleOverlay';
import useLoopedSceneAudio from '../../../../../hooks/useLoopedSceneAudio';
import { modelFile } from '../../../../../utils/appUtils';
import { radians } from '../../../../../utils/math';
import AppleCore from '../../../../elements/appleCore/AppleCore';
import {
  BeerBottle1,
  BeerBottle2,
  WhiskeyBottle,
} from '../../../../elements/bottles/Bottles';
import Bucket from '../../../../elements/bucket/Bucket';
import {
  CardboardBox,
  CardboardFlat,
  CardboardFlat2,
  CardboardLeaning2,
} from '../../../../elements/cardboard/Cardboard';
import {
  BeerCase1,
  BeerCase2,
  CardboardBox1,
  CardboardBox2,
  CardboardBox3,
  CardboardBox4,
  CardboardBox5,
} from '../../../../elements/cardboardBoxes/CardboardBoxes';
import CigaretteButts from '../../../../elements/cigaretteButts/CigaretteButts';
import Dumpster from '../../../../elements/dumpster/Dumpster';
import {
  GarbageBag,
  GarbageBag1,
  GarbageBags1,
  GarbageBags2,
  GarbageBagsPile,
} from '../../../../elements/garbageBags/GarbageBags';
import HappyMeal from '../../../../elements/happyMeal/HappyMeal';
import { Litter, Litter2 } from '../../../../elements/litter/Litter';
import McDonaldsCup from '../../../../elements/mcdonaldsCup/McDonaldsCup';
import NewspaperStack from '../../../../elements/newsPaperStack/NewsPaperStack';
import {
  NewsPaper1,
  NewsPaper2,
  NewsPaper3,
} from '../../../../elements/newsPapers/NewsPapers';
import StarbucksCup from '../../../../elements/starbucksCup/StarbucksCup';

const GROUND_Y = -1;
const SCENE_ROOT_POSITION = [-9, GROUND_Y, 1];
const FLOOR_COLLIDER_HALF_EXTENTS = [15, 0.25, 9];
const FLOOR_COLLIDER_POSITION = [
  -2.25,
  GROUND_Y - FLOOR_COLLIDER_HALF_EXTENTS[1],
  1,
];
const POINTER_TAP_THRESHOLD = 8;
const SHOT_SPAWN_OFFSET = 1.25;
const SHOT_SPEED = 20;
const SHOT_BASE_VERTICAL_BOOST = 2.5;
const SHOT_POINTER_VERTICAL_BOOST = 4.5;
const SHOT_POOL_SLOTS_PER_ASSET = 10;
const SHOT_AIM_PLANE_POINT = [
  SCENE_ROOT_POSITION[0],
  GROUND_Y + 1.5,
  SCENE_ROOT_POSITION[2] + 0.5,
];
const FIRE_LOOP_TRACK = 'looped-fire.mp3';
const FIRE_LOOP_VOLUME = 0.35;
const ASSET_GRID_COLUMNS = 6;
const ASSET_GRID_COLUMN_SPACING = 2.2;
const ASSET_GRID_ROW_SPACING = 3.05;
const ASSET_GRID_POSITION = [4.75, GROUND_Y, 2.2];
const ASSET_GRID_LABEL_HEIGHT = 1.6;

const GARBAGE_BAG_MATERIAL_PROPS = {
  color: '#050505',
  roughness: 0.258,
  metalness: 0,
  specularIntensity: 1,
  ior: 1.45,
};

export const SHOT_ASSET_OPTIONS = [
  {
    key: 'garbage-bag',
    Component: GarbageBag,
    scale: 0.75,
    mass: 0.45,
  },
  {
    key: 'garbage-bag-1',
    Component: GarbageBag1,
    scale: 0.8,
    mass: 0.5,
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    scale: 1,
    mass: 0.7,
  },
  {
    key: 'cardboard-box-2',
    Component: CardboardBox2,
    scale: 1,
    mass: 0.75,
  },
  {
    key: 'cardboard-box-3',
    Component: CardboardBox3,
    scale: 1,
    mass: 0.8,
  },
  {
    key: 'starbucks-cup',
    Component: StarbucksCup,
    scale: 1,
    mass: 0.28,
    colliders: 'hull',
  },
  {
    key: 'apple-core',
    Component: AppleCore,
    scale: 1,
    mass: 0.18,
    colliders: 'hull',
  },
  {
    key: 'cardboard-box-4',
    Component: CardboardBox4,
    scale: 1,
    mass: 0.85,
  },
  {
    key: 'cardboard-box-5',
    Component: CardboardBox5,
    scale: 1,
    mass: 0.9,
  },
  {
    key: 'beer-case-1',
    Component: BeerCase1,
    scale: 1,
    mass: 1.1,
  },
  {
    key: 'beer-case-2',
    Component: BeerCase2,
    scale: 1,
    mass: 1.15,
  },
  {
    key: 'whiskey-bottle',
    Component: WhiskeyBottle,
    scale: 1,
    mass: 0.38,
    colliders: 'hull',
  },
  {
    key: 'beer-bottle-1',
    Component: BeerBottle1,
    scale: 1,
    mass: 0.32,
    colliders: 'hull',
  },
  {
    key: 'beer-bottle-2',
    Component: BeerBottle2,
    scale: 1,
    mass: 0.34,
    colliders: 'hull',
  },
  {
    key: 'bucket',
    Component: Bucket,
    scale: 1.4,
    mass: 0.6,
    colliders: 'hull',
  },
  {
    key: 'happy-meal',
    Component: HappyMeal,
    scale: 1,
    mass: 0.24,
    poolType: 'component',
  },
  {
    key: 'mcdonalds-cup',
    Component: McDonaldsCup,
    scale: 0.1,
    mass: 0.26,
    colliders: 'hull',
    poolType: 'component',
  },
];

export function getRandomShotAsset(random = Math.random) {
  return SHOT_ASSET_OPTIONS[Math.floor(random() * SHOT_ASSET_OPTIONS.length)];
}

const FIXED_SCENE_ITEMS = [
  {
    key: 'dumpster',
    Component: Dumpster,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 2,
    colliders: 'trimesh',
    componentProps: {
      rightLidRotation: -radians(521),
      leftLidRotation: -radians(521),
    },
  },
  // Inside Dumpster
  {
    key: 'garbage-bags-pile',
    Component: GarbageBagsPile,
    position: [0, 1, 0.1],
    rotation: [0, 0, 0],
    scale: 0.65,
  },
  {
    key: 'garbage-bags-2',
    Component: GarbageBags2,
    position: [-1, 2, 0.1],
    rotation: [0, 0, 0],
    scale: 0.8,
  },
  // Under Dumpster
  {
    key: 'litter',
    Component: Litter,
    position: [1, 0, 1],
    rotation: [0, 0, 0],
    scale: 1,
  },
  {
    key: 'litter-2',
    Component: Litter2,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
  },
  {
    key: 'litter',
    Component: Litter,
    position: [-2, 0, 0.8],
    rotation: [0, 0, 0],
    scale: 1,
  },
  {
    key: 'cardboard-flat',
    Component: CardboardFlat,
    position: [-2, 0, 1],
    rotation: [0, 90, 0],
    scale: 1,
  },
  {
    key: 'newspaper-1',
    Component: NewsPaper1,
    position: [-1, 0, 1.4],
    rotation: [0, 90, 0],
    scale: 1,
    showcaseYOffset: 0.01,
  },
  // Right of Dumpster
  {
    key: 'litter-2',
    Component: Litter2,
    position: [-3.5, 0, 1],
    rotation: [0, -Math.PI / 3, 0],
    scale: 1,
  },
  {
    key: 'garbage-bags-1',
    Component: GarbageBags1,
    position: [-2.7, 0, 0],
    rotation: [0, 90, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box',
    Component: CardboardBox,
    position: [-2.2, 0.35, 1.2],
    rotation: [0, 90, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [-3.2, 0.15, 1.2],
    rotation: [0, Math.PI / 3, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [-3.75, 0.15, 1.2],
    rotation: [0, Math.PI / 1.7, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [-3.45, 0.45, 1.2],
    rotation: [0, Math.PI / 2, 0],
    scale: 1,
  },
  {
    key: 'newspaper-2',
    Component: NewsPaper2,
    position: [-5, 0, 2],
    rotation: [0, 90, 0],
    scale: 1,
    showcaseYOffset: 0.01,
  },
  // Front of Dumpster
  {
    key: 'cigarette-butts',
    Component: CigaretteButts,
    position: [0, 0, 1.7],
    rotation: [0, -Math.PI / 1.5, 0],
    scale: 0.75,
    showcaseYOffset: 0.01,
  },
  {
    key: 'cigarette-butts',
    Component: CigaretteButts,
    position: [0.7, 0, 1.2],
    rotation: [0, Math.PI / 2.5, 0],
    scale: 0.75,
  },
  {
    key: 'newspaper-stack',
    Component: NewspaperStack,
    position: [-1.5, 0.1, 1.25],
    rotation: [0, -Math.PI / 1.5, 0],
    scale: 1.25,
  },
  {
    key: 'cardboard-flat-2',
    Component: CardboardFlat2,
    position: [2.4, 0, 0.75],
    rotation: [0, 0, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box-3',
    Component: CardboardBox3,
    position: [2, 0.18, 1.55],
    rotation: [0, -Math.PI / 2, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box-1',
    Component: CardboardBox1,
    position: [1.4, 0.16, 1.3],
    rotation: [0, Math.PI / 3, 0],
    scale: 1,
  },
  // Left of Dumpster
  {
    key: 'cardboard-leaning-2',
    Component: CardboardLeaning2,
    position: [2.17, 0.25, 0],
    rotation: [0, Math.PI / 2, 0],
    scale: 1,
  },
  {
    key: 'litter',
    Component: Litter,
    position: [3, 0, 0.8],
    rotation: [0, -Math.PI / 4, 0],
    scale: 1,
  },
  {
    key: 'cigarette-butts',
    Component: CigaretteButts,
    position: [3, 0, 1.6],
    rotation: [0, Math.PI, 0],
    scale: 0.75,
  },
  {
    key: 'garbage-bags-2',
    Component: GarbageBags2,
    position: [2.5, 0, 0],
    rotation: [0, -Math.PI / 1.3, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box-2',
    Component: CardboardBox2,
    position: [3.1, 0.2, 0.35],
    rotation: [0, Math.PI / 2, 0],
    scale: 1,
  },
  {
    key: 'cardboard-box',
    Component: CardboardBox,
    position: [3.1, 0.4, -0.75],
    rotation: [0, Math.PI / 7, 0],
    scale: 1,
  },
  {
    key: 'newspaper-stack',
    Component: NewspaperStack,
    position: [2.6, 0.1, 1.25],
    rotation: [0, -Math.PI / 1.5, 0],
    scale: 1.25,
  },
  {
    key: 'newspaper-3',
    Component: NewsPaper3,
    position: [4.5, 0, 1.2],
    rotation: [0, 90, 0],
    scale: 1,
    showcaseYOffset: 0.01,
  },
];

const DYNAMIC_SCENE_ITEMS = [
  {
    id: 'right-garbage-bag',
    key: 'garbage-bag',
    Component: GarbageBag,
    position: [-4.0, 0, 0.2],
    rotation: [0, Math.PI / 1.5, 0],
    scale: 0.75,
    mass: 0.45,
  },
  {
    id: 'left-garbage-bag',
    key: 'garbage-bag-1',
    Component: GarbageBag1,
    position: [4, 0, 0.25],
    rotation: [0, 0, 0],
    scale: 0.8,
    mass: 0.5,
  },
  {
    id: 'front-right-cup',
    key: 'starbucks-cup',
    Component: StarbucksCup,
    position: [-1.1, 0.02, 1.95],
    rotation: [Math.PI / 2, Math.PI / 5, 0],
    scale: 1,
    mass: 0.28,
    colliders: 'hull',
  },
  {
    id: 'left-side-cup',
    key: 'starbucks-cup',
    Component: StarbucksCup,
    position: [3.55, 0.02, 1.05],
    rotation: [Math.PI / 2, -Math.PI / 3, 0],
    scale: 1,
    mass: 0.28,
    colliders: 'hull',
  },
  {
    id: 'front-apple-core',
    key: 'apple-core',
    Component: AppleCore,
    position: [0.15, 0.03, 2.05],
    rotation: [Math.PI / 5, -Math.PI / 6, Math.PI / 7],
    scale: 1,
    mass: 0.18,
    colliders: 'hull',
  },
  {
    id: 'left-apple-core',
    key: 'apple-core',
    Component: AppleCore,
    position: [3.4, 0.03, 1.85],
    rotation: [Math.PI / 6, Math.PI / 4, -Math.PI / 5],
    scale: 1,
    mass: 0.18,
    colliders: 'hull',
  },
  {
    id: 'front-left-box-4',
    key: 'cardboard-box-4',
    Component: CardboardBox4,
    position: [-2.4, 0.02, 2.2],
    rotation: [0, Math.PI / 7, 0],
    scale: 1,
    mass: 0.85,
  },
  {
    id: 'front-right-box-5',
    key: 'cardboard-box-5',
    Component: CardboardBox5,
    position: [1.85, 0.02, 2.1],
    rotation: [0, -Math.PI / 6, 0],
    scale: 1,
    mass: 0.9,
  },
  {
    id: 'right-side-beer-case-1',
    key: 'beer-case-1',
    Component: BeerCase1,
    position: [-5.1, 0.02, 0.95],
    rotation: [0, Math.PI / 9, 0],
    scale: 1,
    mass: 1.1,
  },
  {
    id: 'left-side-beer-case-2',
    key: 'beer-case-2',
    Component: BeerCase2,
    position: [4.8, 0.02, -0.2],
    rotation: [0, -Math.PI / 4, 0],
    scale: 1,
    mass: 1.15,
  },
  {
    id: 'front-whiskey-bottle',
    key: 'whiskey-bottle',
    Component: WhiskeyBottle,
    position: [-0.2, 0.04, 2.5],
    rotation: [0, Math.PI / 3, Math.PI / 2],
    scale: 1,
    mass: 0.38,
    colliders: 'hull',
  },
  {
    id: 'right-beer-bottle-1',
    key: 'beer-bottle-1',
    Component: BeerBottle1,
    position: [-4.55, 0.03, 1.55],
    rotation: [Math.PI / 10, 0, Math.PI / 2],
    scale: 1,
    mass: 0.32,
    colliders: 'hull',
  },
  {
    id: 'left-beer-bottle-2',
    key: 'beer-bottle-2',
    Component: BeerBottle2,
    position: [4.15, 0.03, 1.55],
    rotation: [Math.PI / 12, 0, -Math.PI / 2],
    scale: 1,
    mass: 0.34,
    colliders: 'hull',
  },
  {
    id: 'front-bucket',
    key: 'bucket',
    Component: Bucket,
    position: [0.95, 0.02, 2.35],
    rotation: [0, -Math.PI / 8, 0],
    scale: 1,
    mass: 0.6,
    colliders: 'hull',
  },
];

const INSTANCED_TRASH_ASSET_DEFS = {
  'garbage-bag': {
    modelPath: '/garbage_bag.glb',
    geometryName: 'Obj_Bags_5_asset__0',
    customMaterialProps: GARBAGE_BAG_MATERIAL_PROPS,
    transformChain: [{ scale: 0.01 }],
  },
  'garbage-bag-1': {
    modelPath: '/garbage_bag_1.glb',
    geometryName: 'Obj_Bags_4_asset__0',
    customMaterialProps: GARBAGE_BAG_MATERIAL_PROPS,
    transformChain: [{ scale: 0.01 }],
  },
  'cardboard-box-1': {
    modelPath: '/cardboardbox1.glb',
    geometryName: 'cardboard_box_1',
    materialName: 'zOther_Props_01_2',
    transformChain: [{ scale: 0.01 }],
  },
  'cardboard-box-2': {
    modelPath: '/cardboardbox2.glb',
    geometryName: 'cardboard_box_2',
    materialName: 'zOther_Props_01_2',
    transformChain: [{ scale: 0.01 }],
  },
  'cardboard-box-3': {
    modelPath: '/cardboardbox3.glb',
    geometryName: 'cardboard_box_3',
    materialName: 'zOther_Props_01_2',
    transformChain: [{ scale: 0.01 }],
  },
  'starbucks-cup': {
    modelPath: '/starbucks.glb',
    geometryName: 'starbuckscup2_0',
    materialName: 'starbuckscup2_0_mat',
    transformChain: [
      { rotation: [-Math.PI / 2, 0, 0], scale: 0.05 },
      { position: [0, 0, 6.705], rotation: [0, 0, -0.351], scale: 0.13 },
    ],
  },
  'apple-core': {
    modelPath: '/apple_core.glb',
    geometryName: 'AppleCore001',
    materialName: 'AppleCore.001_mat',
    transformChain: [{ rotation: [-Math.PI / 2, 0, 0], scale: 0.1 }],
  },
  'cardboard-box-4': {
    modelPath: '/cardboardBox4.glb',
    geometryName: 'Object_122',
    materialName: 'sm36_002_Cardboard01A_A_Mat',
    transformChain: [{ rotation: [Math.PI / 2, 0, 0], scale: 0.01 }],
  },
  'cardboard-box-5': {
    modelPath: '/cardboardBox5.glb',
    geometryName: 'Object_124',
    materialName: 'sm36_004_Cardboard03A_A_Mat',
    transformChain: [{ rotation: [Math.PI / 2, 0, -0.05], scale: 0.019 }],
  },
  'beer-case-1': {
    modelPath: '/beerCase1.glb',
    geometryName: 'Object_118',
    materialName: 'sm32_143_BeerCase01A_A_Mat',
    transformChain: [{ rotation: [Math.PI / 2, 0, -0.016], scale: 0.01 }],
  },
  'beer-case-2': {
    modelPath: '/beerCase2.glb',
    geometryName: 'Object_116',
    materialName: 'sm32_128_BeerCase01A_A_Mat',
    transformChain: [{ rotation: [Math.PI / 2, 0, -0.016], scale: 0.01 }],
  },
  'whiskey-bottle': {
    modelPath: '/whiskeyBottle.glb',
    geometryName: 'Object_114001',
    materialName: 'sm32_163_DrinkBottle02A_A_Mat',
    transformChain: [{ rotation: [Math.PI / 2, 0, 0], scale: 0.013 }],
  },
  'beer-bottle-1': {
    modelPath: '/beerBottle1.glb',
    geometryName: 'Object_138',
    materialName: 'sm32_159_DrinkBottle01A_A_Mat.001',
    transformChain: [{ rotation: [Math.PI / 2, 0, -Math.PI / 2], scale: 0.02 }],
  },
  'beer-bottle-2': {
    modelPath: '/beerBottle2.glb',
    geometryName: 'Object_140',
    materialName: 'sm32_159_DrinkBottle01A_A_Mat.002',
    transformChain: [
      { rotation: [Math.PI / 2, 0, -Math.PI / 2], scale: 0.018 },
    ],
  },
  bucket: {
    modelPath: '/bucket.glb',
    geometryName: 'Object_142',
    materialName: 'sm30_072_PlasticBucket01A_A',
    transformChain: [{ rotation: [Math.PI / 2, 0, 0], scale: 0.01 }],
  },
};

const INSTANCED_TRASH_POOL_META = SHOT_ASSET_OPTIONS.reduce(
  (meta, asset, assetIndex) => ({
    ...meta,
    [asset.key]: {
      assetIndex,
    },
  }),
  {}
);

function toScaleVector(scale = 1) {
  if (Array.isArray(scale)) {
    return new THREE.Vector3(scale[0], scale[1], scale[2]);
  }

  return new THREE.Vector3(scale, scale, scale);
}

function buildTransformMatrix(transform = {}) {
  const position = new THREE.Vector3(...(transform.position ?? [0, 0, 0]));
  const rotation = new THREE.Euler(...(transform.rotation ?? [0, 0, 0]));
  const quaternion = new THREE.Quaternion().setFromEuler(rotation);
  const scale = toScaleVector(transform.scale ?? 1);

  return new THREE.Matrix4().compose(position, quaternion, scale);
}

function bakeInstancedGeometry(geometry, transformChain = []) {
  const bakedGeometry = geometry.clone();
  const transformMatrix = new THREE.Matrix4();

  transformChain.forEach((transform) => {
    transformMatrix.multiply(buildTransformMatrix(transform));
  });

  bakedGeometry.applyMatrix4(transformMatrix);
  bakedGeometry.computeBoundingBox();
  bakedGeometry.computeBoundingSphere();

  return bakedGeometry;
}

function getParkedShotPosition(assetKey, slotIndex) {
  const { assetIndex } = INSTANCED_TRASH_POOL_META[assetKey];

  return [220 + assetIndex * 14, -160 - slotIndex * 8, 0];
}

function getSceneItemKey({ id, key, position = [0, 0, 0] }) {
  return id ?? `${key}-${position.join('-')}`;
}

function collectUniqueGridAssets(...assetGroups) {
  const seenKeys = new Set();

  return assetGroups.flat().filter((asset) => {
    if (asset.key === 'dumpster' || seenKeys.has(asset.key)) {
      return false;
    }

    seenKeys.add(asset.key);
    return true;
  });
}

const ASSET_GRID_OPTIONS = collectUniqueGridAssets(
  SHOT_ASSET_OPTIONS,
  FIXED_SCENE_ITEMS,
  DYNAMIC_SCENE_ITEMS
).map((asset) => ({
  ...asset,
  showcaseYOffset: asset.showcaseYOffset ?? 0,
}));

function formatAssetStat(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => formatAssetStat(entry)).join(' x ');
  }

  return Number(value)
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');
}

function getAssetComponentName(asset) {
  return asset.Component.displayName ?? asset.Component.name ?? asset.key;
}

function getAssetShowcaseLabel(asset) {
  const lines = [
    getAssetComponentName(asset),
    `scale ${formatAssetStat(asset.scale ?? 1)}`,
  ];

  if (typeof asset.mass === 'number') {
    lines.push(`mass ${formatAssetStat(asset.mass)}`);
  }

  return lines.join('\n');
}

function getAssetGridCellPosition(index) {
  const row = Math.floor(index / ASSET_GRID_COLUMNS);
  const column = index % ASSET_GRID_COLUMNS;
  const rowCount = Math.ceil(ASSET_GRID_OPTIONS.length / ASSET_GRID_COLUMNS);

  return [
    (column - (ASSET_GRID_COLUMNS - 1) / 2) * ASSET_GRID_COLUMN_SPACING,
    0,
    ((rowCount - 1) / 2 - row) * ASSET_GRID_ROW_SPACING,
  ];
}

function useInstancedTrashVisual(assetKey) {
  const assetDef = INSTANCED_TRASH_ASSET_DEFS[assetKey];
  const { nodes, materials } = useGLTF(modelFile(assetDef.modelPath));

  const geometry = useMemo(
    () =>
      bakeInstancedGeometry(
        nodes[assetDef.geometryName].geometry,
        assetDef.transformChain
      ),
    [assetDef.geometryName, assetDef.transformChain, nodes]
  );

  const material = useMemo(() => {
    if (assetDef.customMaterialProps) {
      return new THREE.MeshPhysicalMaterial(assetDef.customMaterialProps);
    }

    return materials[assetDef.materialName].clone();
  }, [assetDef.customMaterialProps, assetDef.materialName, materials]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose?.();
    },
    [geometry, material]
  );

  return { geometry, material };
}

function FixedSceneAsset({ item }) {
  const {
    Component,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    componentProps,
    colliders = 'cuboid',
    rigidBodyProps,
  } = item;

  return (
    <RigidBody
      type="fixed"
      colliders={colliders}
      position={position}
      rotation={rotation}
      scale={scale}
      friction={1.1}
      restitution={0.05}
      {...rigidBodyProps}
    >
      <Component {...componentProps} />
    </RigidBody>
  );
}

function DynamicSceneAsset({ item }) {
  const {
    Component,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    componentProps,
    colliders = 'cuboid',
    mass = 0.5,
    rigidBodyProps,
  } = item;

  return (
    <RigidBody
      colliders={colliders}
      position={position}
      rotation={rotation}
      scale={scale}
      mass={mass}
      friction={1.2}
      restitution={0.08}
      linearDamping={1.2}
      angularDamping={1.6}
      canSleep
      ccd
      {...rigidBodyProps}
    >
      <Component {...componentProps} />
    </RigidBody>
  );
}

function InstancedTrashBodies({ asset, bodyRefsMap }) {
  const bodyRefsStore = bodyRefsMap.current;
  const { geometry, material } = useInstancedTrashVisual(asset.key);
  const bodiesRef = useRef([]);

  const instances = useMemo(
    () =>
      Array.from({ length: SHOT_POOL_SLOTS_PER_ASSET }, (_, slotIndex) => ({
        key: `${asset.key}-shot-slot-${slotIndex}`,
        position: getParkedShotPosition(asset.key, slotIndex),
        rotation: [0, 0, 0],
        scale: asset.scale ?? 1,
        mass: asset.mass ?? 0.5,
      })),
    [asset.key, asset.mass, asset.scale]
  );

  useEffect(() => {
    bodyRefsStore[asset.key] = bodiesRef.current;

    return () => {
      delete bodyRefsStore[asset.key];
    };
  }, [asset.key, bodyRefsStore]);

  return (
    <InstancedRigidBodies
      instances={instances}
      colliders={asset.colliders ?? 'cuboid'}
      mass={asset.mass ?? 0.5}
      friction={1.2}
      restitution={0.08}
      linearDamping={1.2}
      angularDamping={1.6}
      canSleep
      ccd
      ref={bodiesRef}
    >
      <instancedMesh
        castShadow
        receiveShadow
        frustumCulled={false}
        args={[geometry, material, instances.length]}
        count={instances.length}
      />
    </InstancedRigidBodies>
  );
}

function ComponentTrashBodies({ asset, bodyRefsMap }) {
  const bodyRefsStore = bodyRefsMap.current;
  const bodiesRef = useRef([]);
  const { Component } = asset;

  const instances = useMemo(
    () =>
      Array.from({ length: SHOT_POOL_SLOTS_PER_ASSET }, (_, slotIndex) => ({
        key: `${asset.key}-shot-slot-${slotIndex}`,
        position: getParkedShotPosition(asset.key, slotIndex),
        rotation: [0, 0, 0],
      })),
    [asset.key]
  );

  useEffect(() => {
    bodyRefsStore[asset.key] = bodiesRef.current;

    return () => {
      delete bodyRefsStore[asset.key];
    };
  }, [asset.key, bodyRefsStore]);

  return instances.map((instance, slotIndex) => (
    <RigidBody
      key={instance.key}
      colliders={asset.colliders ?? 'cuboid'}
      position={instance.position}
      rotation={instance.rotation}
      scale={asset.scale ?? 1}
      mass={asset.mass ?? 0.5}
      friction={1.2}
      restitution={0.08}
      linearDamping={1.2}
      angularDamping={1.6}
      canSleep
      ccd
      ref={(body) => {
        bodiesRef.current[slotIndex] = body;
      }}
    >
      <Component />
    </RigidBody>
  ));
}

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

function AssetShowcaseGrid() {
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

function getNormalizedPointerPosition(clientX, clientY, domElement) {
  const bounds = domElement.getBoundingClientRect();

  return new THREE.Vector2(
    ((clientX - bounds.left) / bounds.width) * 2 - 1,
    -(((clientY - bounds.top) / bounds.height) * 2 - 1)
  );
}

function createTrashBlast(camera, pointerPosition = new THREE.Vector2(0, 0)) {
  const raycaster = new THREE.Raycaster();
  const rayDirection = new THREE.Vector3();
  const shotDirection = new THREE.Vector3();
  const spawnPosition = new THREE.Vector3();
  const aimPlaneNormal = new THREE.Vector3();
  const aimPlanePoint = new THREE.Vector3(...SHOT_AIM_PLANE_POINT);
  const aimPlane = new THREE.Plane();
  const aimTarget = new THREE.Vector3();

  raycaster.setFromCamera(pointerPosition, camera);
  rayDirection.copy(raycaster.ray.direction).normalize();

  camera.getWorldDirection(aimPlaneNormal);
  aimPlane.setFromNormalAndCoplanarPoint(aimPlaneNormal, aimPlanePoint);

  spawnPosition
    .copy(camera.position)
    .addScaledVector(rayDirection, SHOT_SPAWN_OFFSET);
  spawnPosition.y -= 0.45;

  if (raycaster.ray.intersectPlane(aimPlane, aimTarget)) {
    shotDirection.copy(aimTarget).sub(spawnPosition).normalize();
  } else {
    shotDirection.copy(rayDirection);
  }

  const velocity = shotDirection.clone().multiplyScalar(SHOT_SPEED);
  velocity.y +=
    SHOT_BASE_VERTICAL_BOOST + pointerPosition.y * SHOT_POINTER_VERTICAL_BOOST;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    asset: getRandomShotAsset(),
    position: [spawnPosition.x, spawnPosition.y, spawnPosition.z],
    rotation: [
      THREE.MathUtils.randFloatSpread(Math.PI),
      THREE.MathUtils.randFloatSpread(Math.PI),
      THREE.MathUtils.randFloatSpread(Math.PI),
    ],
    velocity: [velocity.x, velocity.y, velocity.z],
    spin: [
      THREE.MathUtils.randFloatSpread(6),
      THREE.MathUtils.randFloatSpread(12),
      THREE.MathUtils.randFloatSpread(6),
    ],
  };
}

function TrashBlaster() {
  const { camera, gl } = useThree();
  const cameraRef = useRef(camera);
  const pointerDownRef = useRef(null);
  const shotBodiesRef = useRef({});
  const nextShotSlotRef = useRef(
    Object.fromEntries(SHOT_ASSET_OPTIONS.map((asset) => [asset.key, 0]))
  );

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    const { domElement } = gl;

    const fireShot = (pointerPosition = new THREE.Vector2(0, 0)) => {
      const shot = createTrashBlast(cameraRef.current, pointerPosition);
      const poolMeta = INSTANCED_TRASH_POOL_META[shot.asset.key];
      const bodies = shotBodiesRef.current[shot.asset.key];

      if (!poolMeta || !bodies?.length) {
        return;
      }

      const nextSlotOffset = nextShotSlotRef.current[shot.asset.key] ?? 0;
      const slotIndex = nextSlotOffset;
      const body = bodies[slotIndex];

      nextShotSlotRef.current[shot.asset.key] =
        (nextSlotOffset + 1) % SHOT_POOL_SLOTS_PER_ASSET;

      if (!body) {
        return;
      }

      const [x, y, z] = shot.position;
      const [vx, vy, vz] = shot.velocity;
      const [sx, sy, sz] = shot.spin;
      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...shot.rotation)
      );

      body.setTranslation({ x, y, z }, true);
      body.setRotation(
        {
          x: quaternion.x,
          y: quaternion.y,
          z: quaternion.z,
          w: quaternion.w,
        },
        true
      );
      body.setLinvel({ x: vx, y: vy, z: vz }, true);
      body.setAngvel({ x: sx, y: sy, z: sz }, true);
    };

    const handlePointerDown = (event) => {
      if (event.button !== 0) return;

      pointerDownRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const handlePointerUp = (event) => {
      const pointerDown = pointerDownRef.current;
      pointerDownRef.current = null;

      if (!pointerDown || event.button !== 0) return;

      const distance = Math.hypot(
        event.clientX - pointerDown.x,
        event.clientY - pointerDown.y
      );

      if (distance <= POINTER_TAP_THRESHOLD) {
        fireShot(
          getNormalizedPointerPosition(event.clientX, event.clientY, domElement)
        );
      }
    };

    const handleKeyDown = (event) => {
      if (event.code !== 'Space' || event.repeat) return;
      event.preventDefault();
      fireShot();
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gl]);

  return SHOT_ASSET_OPTIONS.map((asset) =>
    asset.poolType === 'component' ? (
      <ComponentTrashBodies
        key={asset.key}
        asset={asset}
        bodyRefsMap={shotBodiesRef}
      />
    ) : (
      <InstancedTrashBodies
        key={asset.key}
        asset={asset}
        bodyRefsMap={shotBodiesRef}
      />
    )
  );
}

export default function DumpsterFire() {
  useLoopedSceneAudio(FIRE_LOOP_TRACK, { volume: FIRE_LOOP_VOLUME });

  return (
    <>
      <PerspectiveCamera makeDefault position={[-2.5, 3.2, 20]} fov={40} />
      <OrbitControls />

      <color attach="background" args={['#e8e8e8']} />
      <fog attach="fog" args={['#e8e8e8', 18, 34]} />

      <ambientLight intensity={0.85} />
      <directionalLight position={[8, 12, 10]} intensity={1.15} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-2.25, GROUND_Y - 0.02, 1]}
        receiveShadow
      >
        <planeGeometry args={[30, 18]} />
        <meshStandardMaterial color="#efefef" />
      </mesh>
      <gridHelper
        args={[30, 15, '#cdcdcd', '#d9d9d9']}
        position={[-2.25, GROUND_Y + 0.001, 1]}
      />

      <AssetShowcaseGrid />

      <Physics timeStep={1 / 60} interpolate>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={FLOOR_COLLIDER_HALF_EXTENTS}
            position={FLOOR_COLLIDER_POSITION}
            friction={1.4}
            restitution={0.05}
          />
        </RigidBody>

        <group position={SCENE_ROOT_POSITION}>
          {FIXED_SCENE_ITEMS.map((item) => (
            <FixedSceneAsset key={getSceneItemKey(item)} item={item} />
          ))}

          {DYNAMIC_SCENE_ITEMS.map((item) => (
            <DynamicSceneAsset key={getSceneItemKey(item)} item={item} />
          ))}
        </group>

        <TrashBlaster />
      </Physics>

      <Environment preset="city" />
      <AudioToggleOverlay />
    </>
  );
}
