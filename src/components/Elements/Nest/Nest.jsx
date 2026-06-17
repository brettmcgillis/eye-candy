import React from 'react';

import Sticks from '../Sticks/Sticks';

// A generic pigeon nest: the Sticks bundle as the base. It holds whatever you nestle
// into it via `children` (eggs, hatchlings, …), so the nest model stays decoupled from
// any one scene's contents — compose the eggs in a parent component instead.
export default function Nest({ children, ...props }) {
  return (
    <group {...props} dispose={null}>
      <Sticks />
      {children}
    </group>
  );
}
