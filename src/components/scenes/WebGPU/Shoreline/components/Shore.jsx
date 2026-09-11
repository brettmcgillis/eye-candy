import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  buildShoreGeometry,
  createShoreMaterial,
} from '../runtime/shoreSurface';

function Shore({ bed, config }) {
  const geometry = useMemo(() => buildShoreGeometry(bed.heights), [bed]);
  const rock = useMemo(() => createShoreMaterial(), []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => rock.material.dispose(), [rock]);

  useFrame(() => rock.update(config));

  return <mesh geometry={geometry} material={rock.material} receiveShadow />;
}

export default memo(Shore);
