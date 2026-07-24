import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';

import { createPortal, useFrame } from '@react-three/fiber';

import { copyObjectTransform } from './furUtils';

const FurRootPortal = forwardRef(function FurRootPortal(
  { children, source, ...groupProps },
  ref
) {
  const groupRef = useRef();

  useImperativeHandle(ref, () => groupRef.current);

  useFrame(() => {
    if (source?.mesh && groupRef.current) {
      copyObjectTransform(groupRef.current, source.mesh);
    }
  });

  const content = useMemo(
    () => (
      <group ref={groupRef} {...groupProps}>
        {children}
      </group>
    ),
    [children, groupProps]
  );

  if (source?.mesh?.parent) {
    return createPortal(content, source.mesh.parent);
  }

  return content;
});

export default FurRootPortal;
