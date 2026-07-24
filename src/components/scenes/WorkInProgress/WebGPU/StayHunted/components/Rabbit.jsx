import React, { forwardRef } from 'react';

import RabbitModel from '../../../../../elements/rabbit/Rabbit';

const EATING_CLIP_PATTERNS = ['eat', 'graze', 'nibble', 'chew', 'feed', 'idle'];

const Rabbit = forwardRef(function Rabbit(props, ref) {
  return (
    <RabbitModel
      ref={ref}
      autoPlay
      autoPlayPatterns={EATING_CLIP_PATTERNS}
      {...props}
    />
  );
});

export default Rabbit;
