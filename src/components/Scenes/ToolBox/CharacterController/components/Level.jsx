import React from 'react';

import Boundaries from './Boundaries';
import DynamicPlatforms from './DynamicPlatforms';
import FloatingPlatform from './FloatingPlatform';
import Floor from './Floor';
import Pool from './Pool';
import RigidObjects from './RigidObjects';
import RoughPlane from './RoughPlane';
import Slopes from './Slopes';
import Steps from './Steps';

// Layout positions — single source of truth for where each level piece lives.
const ROUGH_PLANE_POSITION = [10, -1.2, 10];
const SLOPES_POSITION = [-10, -1, 10];
const STEPS_POSITION = [0, 0, 0];
const RIGID_OBJECTS_POSITION = [0, 0, 0];
const FLOATING_PLATFORM_POSITION = [0, 0, 0];
const DYNAMIC_PLATFORMS_POSITION = [0, 0, 0];
const POOL_POSITION = [-28, 0, 10]; // [x, y, z] — pool is centered on xz plane

export default function Level({
  gridSectionColor,
  gridCellColor,
  onPointerMove,
  onPointerDown,
  onPointerUp,
}) {
  return (
    <>
      <RoughPlane position={ROUGH_PLANE_POSITION} />
      <Slopes position={SLOPES_POSITION} />
      <Steps position={STEPS_POSITION} />
      <RigidObjects position={RIGID_OBJECTS_POSITION} />
      <FloatingPlatform position={FLOATING_PLATFORM_POSITION} />
      <DynamicPlatforms position={DYNAMIC_PLATFORMS_POSITION} />
      <Pool position={POOL_POSITION} />
      <Boundaries gridSectionColor={gridSectionColor} />
      <Floor
        gridSectionColor={gridSectionColor}
        gridCellColor={gridCellColor}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      />
    </>
  );
}
