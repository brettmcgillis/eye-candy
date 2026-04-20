// GridMaterial.jsx - Unreal Engine style grid material
import {
  Fn,
  abs,
  float,
  fract,
  max,
  mix,
  normalWorld,
  positionWorld,
  select,
  step,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useMemo } from 'react';

import { extend } from '@react-three/fiber';

extend(THREE);

function normalizeColor(colorInput, fallback = [1, 1, 1]) {
  if (Array.isArray(colorInput)) {
    const [r = fallback[0], g = fallback[1], b = fallback[2]] = colorInput;
    const uses255Range = r > 1 || g > 1 || b > 1;

    return uses255Range
      ? [r / 255, g / 255, b / 255]
      : [
          Number.isFinite(r) ? r : fallback[0],
          Number.isFinite(g) ? g : fallback[1],
          Number.isFinite(b) ? b : fallback[2],
        ];
  }

  if (
    typeof colorInput === 'string' ||
    typeof colorInput === 'number' ||
    colorInput?.isColor
  ) {
    const c = new THREE.Color();
    c.set(colorInput);
    return [c.r, c.g, c.b];
  }

  return fallback;
}

export function useGridMaterial({
  gridSize = 2,
  lineWidth = 0.03,
  bgColor = [0.45, 0.45, 0.45],
  lineColor = [0.85, 0.85, 0.85],
} = {}) {
  const resolvedBgColor = useMemo(
    () => normalizeColor(bgColor, [0.45, 0.45, 0.45]),
    [bgColor]
  );

  const resolvedLineColor = useMemo(
    () => normalizeColor(lineColor, [0.85, 0.85, 0.85]),
    [lineColor]
  );

  const gridColorNode = useMemo(() => {
    const gridNode = Fn(() => {
      const cellSize = float(gridSize);
      const width = float(lineWidth);

      // Get world position scaled by cell size
      const worldPos = positionWorld.div(cellSize);

      // Get absolute normal to determine dominant axis
      const absNormal = abs(normalWorld);

      // Determine which axis the surface faces most (dominant axis)
      const xDominant = absNormal.x
        .greaterThan(absNormal.y)
        .and(absNormal.x.greaterThan(absNormal.z));
      const yDominant = absNormal.y
        .greaterThan(absNormal.x)
        .and(absNormal.y.greaterThan(absNormal.z));
      // z is dominant if neither x nor y is

      // Select UV coordinates based on dominant axis
      // X-facing: use YZ plane
      // Y-facing: use XZ plane
      // Z-facing: use XY plane
      const gridUV = select(
        xDominant,
        vec2(worldPos.y, worldPos.z),
        select(
          yDominant,
          vec2(worldPos.x, worldPos.z),
          vec2(worldPos.x, worldPos.y)
        )
      );

      // Get position within each cell (0-1)
      const f = fract(gridUV);

      // Create lines at the edges of each cell
      const line = max(step(f.x, width), step(f.y, width));

      // Colors
      const bg = vec3(
        resolvedBgColor[0],
        resolvedBgColor[1],
        resolvedBgColor[2]
      );
      const ln = vec3(
        resolvedLineColor[0],
        resolvedLineColor[1],
        resolvedLineColor[2]
      );

      return mix(bg, ln, line);
    });

    return gridNode();
  }, [gridSize, lineWidth, resolvedBgColor, resolvedLineColor]);

  return { gridColorNode };
}

export function GridMaterial({
  gridSize,
  lineWidth,
  bgColor,
  lineColor,
  roughness = 1,
  metalness = 0,
  side = THREE.DoubleSide,
}) {
  const { gridColorNode } = useGridMaterial({
    gridSize,
    lineWidth,
    bgColor,
    lineColor,
  });

  return (
    <meshStandardNodeMaterial
      colorNode={gridColorNode}
      roughness={roughness}
      metalness={metalness}
      side={side}
    />
  );
}
