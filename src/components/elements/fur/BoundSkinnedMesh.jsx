import React, {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';

const BoundSkinnedMesh = forwardRef(function BoundSkinnedMesh(
  { sourceMesh, geometry = null, material = null, children = null, ...props },
  ref
) {
  const meshRef = useRef();

  useImperativeHandle(ref, () => meshRef.current);

  useLayoutEffect(() => {
    if (!meshRef.current || !sourceMesh?.skeleton || !sourceMesh?.bindMatrix) {
      return;
    }

    meshRef.current.bindMode = sourceMesh.bindMode;
    meshRef.current.bind(sourceMesh.skeleton, sourceMesh.bindMatrix);
  }, [sourceMesh]);

  if (!sourceMesh?.skeleton) {
    return null;
  }

  return (
    <skinnedMesh
      ref={meshRef}
      geometry={geometry || sourceMesh.geometry}
      material={material}
      skeleton={sourceMesh.skeleton}
      {...props}
    >
      {children}
    </skinnedMesh>
  );
});

export default BoundSkinnedMesh;
