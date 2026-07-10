import React, { memo, useMemo } from 'react';

import { RigidBody } from '@react-three/rapier';

import AbandonedChildrensSlide from '../../../../../elements/AbandonedChildrensSlide/AbandonedChildrensSlide';
import AbandonedHouse from '../../../../../elements/AbandonedHouse/AbandonedHouse';
import AbandonedPlayground from '../../../../../elements/AbandonedPlayground/AbandonedPlayground';
import BrokenConcreteDebris from '../../../../../elements/BrokenConcreteDebris/BrokenConcreteDebris';
import CrashedAbandonedCar from '../../../../../elements/CrashedAbandonedCar/CrashedAbandonedCar';
import DamagedChainlinkFenceSegments from '../../../../../elements/DamagedChainlinkFenceSegments/DamagedChainlinkFenceSegments';
import RuinArch from '../../../../../elements/RuinArch/RuinArch';
import RuinArchBroken from '../../../../../elements/RuinArchBroken/RuinArchBroken';
import ShippingContainer from '../../../../../elements/ShippingContainer/ShippingContainer';
import Bret from '../../../../../elements/bret/Bret';
import { getSetting, pickAnchor, rollChunkSetting } from '../utils/settings';

const ELEMENTS = {
  arch: RuinArch,
  archBroken: RuinArchBroken,
  bret: Bret,
  container: ShippingContainer,
  crashedCar: CrashedAbandonedCar,
  debris: BrokenConcreteDebris,
  fenceSegments: DamagedChainlinkFenceSegments,
  house: AbandonedHouse,
  playground: AbandonedPlayground,
  slide: AbandonedChildrensSlide,
};

// Renders whatever abandoned setting this chunk rolled (or nothing).
// Pieces are placed at the chunk's anchor — nudged toward the path network
// — then each piece snaps its own base to the terrain so a sloped site
// doesn't leave props floating. Cuboid auto-colliders keep the ghost from
// walking through walls without paying for trimesh hulls.
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
        element: piece.element,
        key: `${piece.element}:${index}`,
        position: [x, y, z],
        rotationY: anchor.yaw + piece.rotationY,
        scale: piece.scale,
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
        return (
          <RigidBody
            key={piece.key}
            colliders="cuboid"
            position={piece.position}
            rotation={[0, piece.rotationY, 0]}
            scale={piece.scale}
            type="fixed"
          >
            <Element />
          </RigidBody>
        );
      })}
    </group>
  );
}

export default memo(SettingChunk);
