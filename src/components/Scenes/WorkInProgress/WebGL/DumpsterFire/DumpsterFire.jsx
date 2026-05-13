import * as THREE from 'three';

import React, { useEffect, useRef, useState } from 'react';

import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';

import { radians } from '../../../../../utils/math';
import {
  CardboardBox,
  CardboardFlat,
  CardboardFlat2,
  CardboardLeaning2,
} from '../../../../elements/cardboard/Cardboard';
import {
  CardboardBox1,
  CardboardBox2,
  CardboardBox3,
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
import { Litter, Litter2 } from '../../../../elements/litter/Litter';
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
const MAX_ACTIVE_SHOTS = 24;
const POINTER_TAP_THRESHOLD = 8;
const SHOT_SPAWN_OFFSET = 1.25;
const SHOT_SPEED = 20;
const SHOT_VERTICAL_BOOST = 5.5;

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
  },
  // Front of Dumpster
  {
    key: 'cigarette-butts',
    Component: CigaretteButts,
    position: [0, 0, 1.7],
    rotation: [0, -Math.PI / 1.5, 0],
    scale: 0.75,
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
    rotation: [0, Math.PI / 5, 0],
    scale: 1,
    mass: 0.28,
    colliders: 'hull',
  },
  {
    id: 'left-side-cup',
    key: 'starbucks-cup',
    Component: StarbucksCup,
    position: [3.55, 0.02, 1.05],
    rotation: [0, -Math.PI / 3, 0],
    scale: 1,
    mass: 0.28,
    colliders: 'hull',
  },
];

function getSceneItemKey({ id, key, position = [0, 0, 0] }) {
  return id ?? `${key}-${position.join('-')}`;
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

function TrashShot({ shot }) {
  const bodyRef = useRef(null);
  const {
    asset,
    position,
    rotation = [0, 0, 0],
    velocity,
    spin = [0, 0, 0],
  } = shot;
  const {
    Component,
    scale = 1,
    componentProps,
    colliders = 'cuboid',
    mass = 0.65,
  } = asset;

  useEffect(() => {
    if (!bodyRef.current) return;

    bodyRef.current.setAngvel({ x: spin[0], y: spin[1], z: spin[2] }, true);
  }, [spin]);

  return (
    <RigidBody
      ref={bodyRef}
      colliders={colliders}
      position={position}
      rotation={rotation}
      scale={scale}
      linearVelocity={velocity}
      mass={mass}
      friction={1}
      restitution={0.14}
      linearDamping={0.45}
      angularDamping={0.8}
      canSleep
      ccd
    >
      <Component {...componentProps} />
    </RigidBody>
  );
}

function createTrashShot(camera) {
  const direction = new THREE.Vector3();
  const spawnPosition = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.normalize();

  spawnPosition
    .copy(camera.position)
    .addScaledVector(direction, SHOT_SPAWN_OFFSET);
  spawnPosition.y -= 0.45;

  const velocity = direction.clone().multiplyScalar(SHOT_SPEED);
  velocity.y += SHOT_VERTICAL_BOOST;

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

function TrashShooter() {
  const { camera, gl } = useThree();
  const [shots, setShots] = useState([]);
  const cameraRef = useRef(camera);
  const pointerDownRef = useRef(null);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    const { domElement } = gl;

    const fireShot = () => {
      const shot = createTrashShot(cameraRef.current);
      setShots((prev) => [...prev.slice(-(MAX_ACTIVE_SHOTS - 1)), shot]);
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
        fireShot();
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

  return shots.map((shot) => <TrashShot key={shot.id} shot={shot} />);
}

export default function DumpsterFire() {
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

        <TrashShooter />
      </Physics>

      <Environment preset="city" />
    </>
  );
}
