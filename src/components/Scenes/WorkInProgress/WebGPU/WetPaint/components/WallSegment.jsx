import * as THREE from 'three';

import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import PaintDecal from './PaintDecal';

// Single source of truth for block placement, shared by the instanced
// geometry AND the paint mask below — if they used separate loops they could
// drift apart and paint would land on cells that don't visually exist.
function buildBrickGrid({ blockSize, gap, height, length, variantCount }) {
  const columnSpan = blockSize.x + gap;
  const rowSpan = blockSize.y;
  const columns = Math.max(1, Math.round(length / columnSpan));
  const rows = Math.max(1, Math.round(height / rowSpan));
  const cells = [];

  for (let row = 0; row < rows; row += 1) {
    // Staggered rows keep a full column count but shift half a span, so both
    // ends overhang by half a block instead of leaving a half-block hole.
    // The overhang tucks into the perpendicular segment at the corner (see
    // BrickWall.jsx), closing the every-other-row gaps (todo item 49).
    const staggered = row % 2 === 1 && columns > 1;
    const rowLength = columns * columnSpan;
    const startX =
      -rowLength / 2 + blockSize.x / 2 + (staggered ? columnSpan / 2 : 0);
    const y = blockSize.y / 2 + row * rowSpan;

    for (let column = 0; column < columns; column += 1) {
      cells.push({
        x: startX + column * columnSpan,
        y,
        variantIndex: (row * 7 + column * 3) % variantCount,
      });
    }
  }

  return { cells, columns, rows };
}

// Rasterizes the same grid as a black/white mask (white = a real block,
// black = mortar gap) used as the paint decal's alphaMap, so a spray stroke
// never bleeds across a brick gap onto nothing (todo item 39).
function buildBrickMaskTexture({ blockSize, cells, height, length }) {
  const resolution = 512;
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = Math.max(1, Math.round(resolution * (height / length)));

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';

  const halfW = ((blockSize.x / length) * canvas.width) / 2;
  const halfH = ((blockSize.y / height) * canvas.height) / 2;

  cells.forEach((cell) => {
    const px = ((cell.x + length / 2) / length) * canvas.width;
    const py = canvas.height - (cell.y / height) * canvas.height;
    ctx.fillRect(px - halfW, py - halfH, halfW * 2, halfH * 2);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function InstancedVariant({ geometry, material, positions }) {
  const meshRef = useRef(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    positions.forEach((position, index) => {
      dummy.position.set(...position);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  if (!positions.length) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, positions.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

// One straight run of the bracket-shaped wall (see BrickWall.jsx) — a block
// grid plus, when `paintable`, a brick-masked PaintDecal on its face.
// `position`/`rotation` place the whole segment; the grid itself is always
// built flat along local X/Y with its face along local +Z.
function WallSegment({
  brickGap,
  height,
  length,
  paintable = false,
  position,
  rotation,
  variants,
}) {
  const blockSize = variants[0].size;

  const { cells } = useMemo(
    () =>
      buildBrickGrid({
        blockSize,
        gap: brickGap,
        height,
        length,
        variantCount: variants.length,
      }),
    [blockSize, brickGap, height, length, variants.length]
  );

  const positionsByVariant = useMemo(() => {
    const grouped = variants.map(() => []);
    cells.forEach((cell) => {
      grouped[cell.variantIndex].push([cell.x, cell.y, 0]);
    });
    return grouped;
  }, [cells, variants]);

  const maskTexture = useMemo(() => {
    if (!paintable) return null;
    return buildBrickMaskTexture({ blockSize, cells, height, length });
  }, [blockSize, cells, height, length, paintable]);

  useEffect(() => () => maskTexture?.dispose(), [maskTexture]);

  return (
    <group position={position} rotation={rotation}>
      {variants.map((variant, i) => (
        <InstancedVariant
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          geometry={variant.geometry}
          material={variant.material}
          positions={positionsByVariant[i]}
        />
      ))}
      {paintable && (
        <PaintDecal
          width={length}
          height={height}
          alphaMap={maskTexture}
          position={[0, height / 2, blockSize.z / 2 + 0.005]}
        />
      )}
    </group>
  );
}

export default memo(WallSegment);
