import React, { memo } from 'react';

import CinderBlock1 from '@elements/Cinderblocks/CinderBlock1';
import CinderBlock2 from '@elements/Cinderblocks/CinderBlock2';
import CinderBlock3 from '@elements/Cinderblocks/CinderBlock3';
import CinderBlock4 from '@elements/Cinderblocks/CinderBlock4';

import { CINDERBLOCKS } from '../utils/cruiser';

const BLOCKS = {
  cinderBlock1: CinderBlock1,
  cinderBlock2: CinderBlock2,
  cinderBlock3: CinderBlock3,
  cinderBlock4: CinderBlock4,
};
const DEG = Math.PI / 180;
const xyz = (v) => [v.x, v.y, v.z];

// The blocks the stripped cruiser sits on, in place of its tyres.
function Cinderblocks({ config }) {
  return CINDERBLOCKS.map(({ id }) => {
    const Block = BLOCKS[id];
    return (
      <Block
        key={id}
        position={xyz(config[`${id}Position`])}
        rotation={xyz(config[`${id}Rotation`]).map((v) => v * DEG)}
        scale={xyz(config[`${id}Scale`])}
      />
    );
  });
}

export default memo(Cinderblocks);
