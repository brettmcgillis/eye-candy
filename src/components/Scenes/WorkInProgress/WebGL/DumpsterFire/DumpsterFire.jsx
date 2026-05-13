import React from 'react';

import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';

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

const GROUND_Y = -1;
const SCENE_ROOT_POSITION = [-9, GROUND_Y, 1];

const SCENE_ITEMS = [
  {
    key: 'dumpster',
    Component: Dumpster,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 2,
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
    key: 'garbage-bag',
    Component: GarbageBag,
    position: [-4.0, 0, 0.2],
    rotation: [0, Math.PI / 1.5, 0],
    scale: 0.75,
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
    key: 'garbage-bag-1',
    Component: GarbageBag1,
    position: [4, 0, 0.25],
    rotation: [0, 0, 0],
    scale: 0.8,
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

function SceneAsset({
  Component,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  componentProps,
}) {
  return (
    <Component
      position={position}
      rotation={rotation}
      scale={scale}
      {...componentProps}
    />
  );
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

      <group position={SCENE_ROOT_POSITION}>
        {SCENE_ITEMS.map(({ key, position, ...asset }) => (
          <SceneAsset
            key={`${key}-${position.join('-')}`}
            position={position}
            {...asset}
          />
        ))}
      </group>

      <Environment preset="city" />
    </>
  );
}
