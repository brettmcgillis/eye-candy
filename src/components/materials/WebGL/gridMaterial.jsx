import React, { useEffect, useMemo } from 'react';

import * as THREE from 'three';

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

export default function GridMaterial({
  gridSize = 1,
  lineWidth = 0.8,
  bgColor = [0.85, 0.85, 0.85],
  lineColor = [0.13, 0.13, 0.13],
  roughness = 1,
  metalness = 0,
  side = THREE.DoubleSide,
}) {
  const resolvedBgColor = useMemo(
    () => normalizeColor(bgColor, [0.85, 0.85, 0.85]),
    [bgColor]
  );
  const resolvedLineColor = useMemo(
    () => normalizeColor(lineColor, [0.13, 0.13, 0.13]),
    [lineColor]
  );

  const cacheKey = useMemo(
    () =>
      [
        'grid-standard',
        gridSize,
        lineWidth,
        roughness,
        metalness,
        side,
        ...resolvedBgColor,
        ...resolvedLineColor,
      ].join('|'),
    [
      gridSize,
      lineWidth,
      roughness,
      metalness,
      side,
      resolvedBgColor,
      resolvedLineColor,
    ]
  );

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: 'white',
      roughness,
      metalness,
      side,
    });

    m.onBeforeCompile = (shader) => {
      const compiledShader = shader;

      compiledShader.uniforms.uGridBgColor = {
        value: new THREE.Color(...resolvedBgColor),
      };
      compiledShader.uniforms.uGridLineColor = {
        value: new THREE.Color(...resolvedLineColor),
      };
      compiledShader.uniforms.uGridSize = { value: gridSize };
      compiledShader.uniforms.uGridLineWidth = { value: lineWidth };

      compiledShader.vertexShader = compiledShader.vertexShader
        .replace(
          'void main() {',
          `
varying vec3 vGridWorldPosition;
void main() {
`
        )
        .replace(
          '#include <begin_vertex>',
          `
#include <begin_vertex>
vec4 gridWorldPosition = modelMatrix * vec4(transformed, 1.0);
vGridWorldPosition = gridWorldPosition.xyz;
`
        );

      compiledShader.fragmentShader = compiledShader.fragmentShader
        .replace(
          'void main() {',
          `
varying vec3 vGridWorldPosition;
uniform vec3 uGridBgColor;
uniform vec3 uGridLineColor;
uniform float uGridSize;
uniform float uGridLineWidth;
void main() {
`
        )
        .replace(
          '#include <map_fragment>',
          `
vec2 gridCoord = vGridWorldPosition.xz / max(uGridSize, 0.0001);
vec2 gridCell = abs(fract(gridCoord - 0.5) - 0.5) / fwidth(gridCoord);
float distToLine = min(gridCell.x, gridCell.y);
float line = 1.0 - min(distToLine / max(uGridLineWidth, 0.0001), 1.0);
vec3 gridColor = mix(uGridBgColor, uGridLineColor, line);
diffuseColor.rgb *= gridColor;
`
        );
    };

    m.customProgramCacheKey = () => cacheKey;
    return m;
  }, [
    cacheKey,
    gridSize,
    lineWidth,
    metalness,
    resolvedBgColor,
    resolvedLineColor,
    roughness,
    side,
  ]);

  useEffect(() => () => material.dispose(), [material]);

  return <primitive object={material} attach="material" />;
}
