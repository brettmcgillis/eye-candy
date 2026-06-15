import React from 'react';

import { SodaCan } from '../../../../../elements/SodaCan/SodaCan';
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
// bags / soda can bake their own scale, so they only need placement here.
export default function TrashScene() {
  return (
    <group>
      {/* Two upright cans clustered by the streetlight base */}
      <Trashcan1 position={[-2.1, 0, -1.05]} />
      <Trashcan2 position={[-1.45, 0, -2.0]} rotation={[0, 0.6, 0]} />

      {/* The raided can, split into two pieces so each rests naturally on the
          ground (tipping the whole model leaves the leaning lid sticking up).
          Can on its side; lid lying flat nearby. Positions are eyeballed — tune
          in-scene since each mesh keeps the model's baked local offset. */}
      <Trashcan4
        showLid={false}
        position={[-0.1, 0.26, 0.1]}
        rotation={[0, -0.5, Math.PI / 2]}
      />
      <Trashcan4
        showCan={false}
        position={[0.55, 0.02, 0.45]}
        rotation={[-Math.PI / 2, 0, 0.4]}
      />

      {/* Two garbage bags mixed in with the cans */}
      <GarbageBag1 position={[-1.9, 0, -0.2]} rotation={[0, 1.2, 0]} />
      <GarbageBags1 position={[-2.4, 0, -1.9]} rotation={[0, -0.5, 0]} />

      {/* Scattered litter spilling from the toppled can */}
      <Litter position={[0.6, 0.01, 0.7]} scale={0.4} />
      <Litter2
        position={[-0.7, 0.01, 0.9]}
        rotation={[0, 1.0, 0]}
        scale={0.45}
      />
      <SodaCan
        position={[0.9, 0.05, 0.2]}
        rotation={[0, 0.3, 0]}
        scale={0.01}
      />
      <NewsPaper1
        position={[1.3, 0.01, 0.9]}
        rotation={[0, 0.8, 0]}
        scale={0.5}
      />
    </group>
  );
}
