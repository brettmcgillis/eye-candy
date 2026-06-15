import React from 'react';

import Egg from '../Egg/Egg';
import Sticks from '../Sticks/Sticks';

// A pigeon nest: the Sticks bundle as the base with two eggs nestled on top.
//
// The Egg component pre-rotates its mesh and leaves the egg floating ~0.498 above
// its group origin (model-local), so blind defaults are unreliable — each egg gets
// its own position + rotation (nest-local, so it rides with the nest) plus a shared
// eggScale, all tuned live from the scene's Nest controls.

const v3 = (o) => [o.x, o.y, o.z];

export default function Nest({
  eggScale = 0.5,
  egg1Pos = { x: -0.08, y: -0.16, z: 0.03 },
  egg1Rot = { x: 0, y: 0.4, z: 0 },
  egg2Pos = { x: 0.09, y: -0.16, z: -0.05 },
  egg2Rot = { x: 0, y: -0.3, z: 0 },
  ...props
}) {
  return (
    <group {...props} dispose={null}>
      <Sticks />
      <Egg scale={eggScale} position={v3(egg1Pos)} rotation={v3(egg1Rot)} />
      <Egg scale={eggScale} position={v3(egg2Pos)} rotation={v3(egg2Rot)} />
    </group>
  );
}
