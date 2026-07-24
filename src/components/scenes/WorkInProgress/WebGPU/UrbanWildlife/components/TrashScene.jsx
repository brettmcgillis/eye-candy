import React from 'react';

import Trashcan1 from '../../../../../elements/Trashcan1/Trashcan1';
import Trashcan2 from '../../../../../elements/Trashcan2/Trashcan2';
import Trashcan4 from '../../../../../elements/Trashcan4/Trashcan4';
import {
  GarbageBag1,
  GarbageBags1,
} from '../../../../../elements/garbageBags/GarbageBags';
import { Litter, Litter2 } from '../../../../../elements/litter/Litter';
import { NewsPaper1 } from '../../../../../elements/newsPapers/NewsPapers';

// Composes the shared element components into the scene's trash pile. The garbage
// bags / soda can bake their own scale, so they only need placement here. The four
// trash-can pieces are positioned/rotated from the `cans` prop so they're tunable
// via Leva (t1/t2 upright cans, t3 tipped can body, t4 lid).
export default function TrashScene({ cans }) {
  if (!cans?.t1) return null;
  return (
    <group>
      {/* Two upright cans clustered by the streetlight base */}
      <Trashcan1 position={cans.t1.position} rotation={cans.t1.rotation} />
      <Trashcan2 position={cans.t2.position} rotation={cans.t2.rotation} />

      {/* The raided can, split into two pieces so each rests naturally on the
          ground (tipping the whole model leaves the leaning lid sticking up).
          Can on its side; lid lying flat nearby. Each mesh keeps the model's
          baked local offset, so tune the two pieces independently. */}
      <Trashcan4
        showLid={false}
        position={cans.t3.position}
        rotation={cans.t3.rotation}
      />
      <Trashcan4
        showCan={false}
        position={cans.t4.position}
        rotation={cans.t4.rotation}
      />

      {/* Two garbage bags mixed in with the cans */}
      <GarbageBag1
        position={[-1.9, 0, -0.2]}
        rotation={[0, 1.2, 0]}
        scale={0.5}
      />
      <GarbageBags1
        position={[-2.4, 0, -1.9]}
        rotation={[0, -0.5, 0]}
        scale={0.5}
      />

      {/* Scattered litter spilling from the toppled can */}
      <Litter position={[0.6, 0.01, 0.7]} scale={0.4} />
      <Litter2
        position={[-0.7, 0.01, 0.9]}
        rotation={[0, 1.0, 0]}
        scale={0.45}
      />

      <NewsPaper1
        position={[1.3, 0.01, 0.9]}
        rotation={[0, 0.8, 0]}
        scale={0.5}
      />
    </group>
  );
}
