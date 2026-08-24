import React, { memo, useMemo } from 'react';

import { useTexture } from '@react-three/drei';

import * as THREE from 'three/webgpu';

import useArrowDrag from '../hooks/useArrowDrag';
import { SIGN_URLS } from '../utils/signVariants';

const SIGN_WIDTH = 48;
const VECTOR_ARROW_COLOR = '#ffffff';

useTexture.preload(SIGN_URLS);

// The "street sign" style — a real road-sign image (see signVariants.js).
// `variant` is `{url, aspect}`; `aspect` sizes the plane to the source
// image's real proportions so it doesn't stretch.
function SignArrowMesh({ dragHandlers, variant }) {
  const texture = useTexture(variant.url);
  const [signWidth, signHeight] = useMemo(
    () => [SIGN_WIDTH, SIGN_WIDTH / variant.aspect],
    [variant]
  );

  return (
    <mesh {...dragHandlers}>
      <planeGeometry args={[signWidth, signHeight]} />
      {/* DoubleSide is load-bearing: DesktopStage's pixel-space ortho
          camera is Y-flipped (top=0, bottom=height), which reverses
          triangle winding — with default FrontSide the plane would be
          backface-culled and invisible (see FluidField.jsx for the same
          reasoning). */}
      <meshBasicMaterial
        depthWrite={false}
        map={texture}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  );
}

// The "regular arrows" style — a flat hand-built polygon (see
// arrowShapes.js). `variant` is `{geometry}`, a THREE.ShapeGeometry shared
// across every window that landed on this variant.
function VectorArrowMesh({ dragHandlers, variant }) {
  return (
    <mesh geometry={variant.geometry} {...dragHandlers}>
      <meshBasicMaterial
        color={VECTOR_ARROW_COLOR}
        depthWrite={false}
        opacity={0.6}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  );
}

// A single-mesh direction indicator at each alive window's center, pointing
// along that window's own broadcast gravity direction. Only the window
// that owns it (`draggable`) actually responds to pointer events —
// dragging another window's arrow can't do anything useful since that
// window's Leva control lives in a different browser tab, so it renders
// read-only there.
//
// `signStyle` (a local, per-tab Leva toggle — see getGravityControls.js)
// picks which of the two mesh components renders; GravityRoomsView passes
// the matching variant type (sign `{url,aspect}` vs vector `{geometry}`)
// for whichever is active. One mesh is load-bearing either way, not just
// tidy: an earlier version split the vector style into a separate plane
// (shaft) + coneGeometry (head) + invisible circle (drag handle), and
// three coplanar meshes at the same local position left the raycaster
// picking between them near-arbitrarily on ties (same hit distance, so the
// outcome depended on rounding, not geometry) — that was the original
// "unpredictable" drag. One mesh removes that ambiguity, and the whole
// shape — not a tiny handle — is the hit target.
function GravityArrow({
  angleDeg,
  center,
  draggable,
  onDrag,
  signStyle,
  variant,
}) {
  const rotationZ = useMemo(() => (angleDeg * Math.PI) / 180, [angleDeg]);
  const dragHandlers = useArrowDrag({ draggable, onDrag });

  return (
    <group position={[center.x, center.y, 1]} rotation={[0, 0, rotationZ]}>
      {signStyle ? (
        <SignArrowMesh dragHandlers={dragHandlers} variant={variant} />
      ) : (
        <VectorArrowMesh dragHandlers={dragHandlers} variant={variant} />
      )}
    </group>
  );
}

export default memo(GravityArrow);
