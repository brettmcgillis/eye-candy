import React, { memo, useMemo } from 'react';

import { CylinderCollider, RigidBody } from '@react-three/rapier';

import { hash01 } from '../../../../../../utils/noise2d';
import { pickAnchor, rollChunkSetting } from '../utils/settings';
import getTreeTemplates from '../utils/trees';
import { CHUNK_SIZE } from '../utils/worldgen';

// ez-tree instances scattered per chunk: deterministic placement off the
// worldgen samplers (off the paths, out of the ponds, clear of the chunk's
// abandoned setting), with a fixed trunk collider so the ghost weaves
// between trees instead of through them. Bushes (last template) skip the
// collider.
function buildPlacements({ config, cx, cz, world }) {
  const templates = getTreeTemplates();
  const placements = [];
  const centerX = cx * CHUNK_SIZE;
  const centerZ = cz * CHUNK_SIZE;
  const half = CHUNK_SIZE * 0.48;
  const chunkSeed = world.seed + cx * 9241 + cz * 12251;
  const target = Math.max(0, Math.floor(config.treesPerChunk));
  const attempts = target * 8;

  // Keep trees out of the abandoned setting's footprint.
  const settingKey = rollChunkSetting({
    cx,
    cz,
    density: config.settingDensity,
    seed: world.seed,
  });
  const anchor =
    settingKey && config.settingsEnabled ? pickAnchor({ cx, cz, world }) : null;

  for (let i = 0; i < attempts && placements.length < target; i += 1) {
    const x = centerX + (hash01(i, 5, chunkSeed) * 2 - 1) * half;
    const z = centerZ + (hash01(i, 11, chunkSeed) * 2 - 1) * half;

    if (world.samplePath(x, z) > 0.2) {
      continue; // eslint-disable-line no-continue
    }
    const y = world.sampleHeight(x, z);
    if (y < world.waterLevel + 0.5) {
      continue; // eslint-disable-line no-continue
    }
    if (anchor && Math.hypot(x - anchor.x, z - anchor.z) < 14) {
      continue; // eslint-disable-line no-continue
    }

    const templateIndex = Math.floor(
      hash01(i, 19, chunkSeed) * templates.length
    );
    const scale = config.treeScale * (0.6 + hash01(i, 23, chunkSeed) * 0.8);

    placements.push({
      isBush: templateIndex === templates.length - 1,
      key: `${i}`,
      scale,
      templateIndex,
      x,
      y: y - 0.05,
      yaw: hash01(i, 29, chunkSeed) * Math.PI * 2,
      z,
    });
  }

  return placements;
}

function TreeChunk({ config, cx, cz, world }) {
  const placements = useMemo(
    () => buildPlacements({ config, cx, cz, world }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      config.settingDensity,
      config.settingsEnabled,
      config.treeScale,
      config.treesPerChunk,
      cx,
      cz,
      world,
    ]
  );

  const clones = useMemo(
    () =>
      placements.map((placement) =>
        getTreeTemplates()[placement.templateIndex].clone()
      ),
    [placements]
  );

  if (!placements.length) return null;

  return (
    <group>
      {placements.map((placement, index) => (
        <group
          key={placement.key}
          position={[placement.x, placement.y, placement.z]}
          rotation-y={placement.yaw}
          scale={placement.scale}
        >
          <primitive object={clones[index]} />
        </group>
      ))}
      {placements
        .filter((placement) => !placement.isBush)
        .map((placement) => (
          <RigidBody
            key={`c${placement.key}`}
            colliders={false}
            position={[placement.x, placement.y, placement.z]}
            type="fixed"
          >
            <CylinderCollider
              args={[2.2 * placement.scale, 0.28 * placement.scale]}
              position={[0, 2.2 * placement.scale, 0]}
            />
          </RigidBody>
        ))}
    </group>
  );
}

export default memo(TreeChunk);
