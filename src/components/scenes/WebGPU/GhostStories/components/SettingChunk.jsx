import React, { memo, useMemo } from 'react';

import { RigidBody } from '@react-three/rapier';

import AbandonedCar from '@elements/AbandonedCar/AbandonedCar';
import AbandonedChildrensSlide from '@elements/AbandonedChildrensSlide/AbandonedChildrensSlide';
import AbandonedHouse from '@elements/AbandonedHouse/AbandonedHouse';
import AbandonedPlayground from '@elements/AbandonedPlayground/AbandonedPlayground';
import BrokenConcreteDebris, {
  DebrisPiece,
} from '@elements/BrokenConcreteDebris/BrokenConcreteDebris';
import CrashedAbandonedCar from '@elements/CrashedAbandonedCar/CrashedAbandonedCar';
import DamagedChainlinkFenceSegments, {
  FenceSegment,
} from '@elements/DamagedChainlinkFenceSegments/DamagedChainlinkFenceSegments';
import RuinArch from '@elements/RuinArch/RuinArch';
import RuinArchBroken from '@elements/RuinArchBroken/RuinArchBroken';
import ShippingContainer from '@elements/ShippingContainer/ShippingContainer';
import Bret from '@elements/bret/Bret';
import FireAndSmoke from '@elements/fireAndSmoke/FireAndSmoke';

import { getSetting, pickAnchor, rollChunkSetting } from '../utils/settings';

// A crackling campfire piece: the renderer-agnostic fire/smoke element plus
// a warm flickerless point light (post pass may add flicker later).
function Campfire(props) {
  return (
    <group {...props}>
      <FireAndSmoke scale={0.5} />
      <pointLight
        color="#ff9a3c"
        decay={2}
        distance={18}
        intensity={14}
        position={[0, 1.2, 0]}
      />
    </group>
  );
}

const ELEMENTS = {
  arch: RuinArch,
  archBroken: RuinArchBroken,
  bret: Bret,
  campfire: Campfire,
  carPack: AbandonedCar,
  container: ShippingContainer,
  crashedCar: CrashedAbandonedCar,
  debris: BrokenConcreteDebris,
  debrisPiece: DebrisPiece,
  fenceSegment: FenceSegment,
  fenceSegments: DamagedChainlinkFenceSegments,
  house: AbandonedHouse,
  playground: AbandonedPlayground,
  slide: AbandonedChildrensSlide,
};

// Renders whatever abandoned setting this chunk rolled (or nothing).
// Pieces are placed at the chunk's anchor — nudged toward the path network
// — then each piece snaps its own base to the terrain so a sloped site
// doesn't leave props floating. Scale/rotation are applied at the wrapper
// (never inside the element); pieces with `collider: false` render without
// a rigid body so the ghost can drift through them.
function SettingChunk({ config, cx, cz, world }) {
  const placed = useMemo(() => {
    const key = rollChunkSetting({
      cx,
      cz,
      density: config.settingDensity,
      seed: world.seed,
    });
    const setting = getSetting(key);
    if (!setting) return null;

    const anchor = pickAnchor({ cx, cz, world });
    if (!anchor) return null;

    const sinYaw = Math.sin(anchor.yaw);
    const cosYaw = Math.cos(anchor.yaw);

    const pieces = setting.pieces.map((piece, index) => {
      // Rotate the layout by the setting yaw, then drop onto the terrain.
      const localX = piece.position[0];
      const localZ = piece.position[2];
      const x = anchor.x + localX * cosYaw - localZ * sinYaw;
      const z = anchor.z + localX * sinYaw + localZ * cosYaw;
      const y = world.sampleHeight(x, z) + piece.position[1];

      return {
        collider: piece.collider !== false,
        element: piece.element,
        key: `${piece.element}:${index}`,
        position: [x, y, z],
        props: piece.props,
        rotationY: anchor.yaw + (piece.rotationY ?? 0),
        scale: piece.scale ?? 1,
      };
    });

    return { key, pieces };
  }, [config.settingDensity, cx, cz, world]);

  if (!placed || !config.settingsEnabled) return null;

  return (
    <group>
      {placed.pieces.map((piece) => {
        const Element = ELEMENTS[piece.element];
        if (!Element) return null;

        if (!piece.collider) {
          return (
            <group
              key={piece.key}
              position={piece.position}
              rotation={[0, piece.rotationY, 0]}
              scale={piece.scale}
            >
              <Element {...piece.props} />
            </group>
          );
        }

        return (
          <RigidBody
            key={piece.key}
            colliders="cuboid"
            position={piece.position}
            rotation={[0, piece.rotationY, 0]}
            scale={piece.scale}
            type="fixed"
          >
            <Element {...piece.props} />
          </RigidBody>
        );
      })}
    </group>
  );
}

export default memo(SettingChunk);
