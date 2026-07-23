/* eslint-disable no-param-reassign */
import { viewportSafeUV, viewportSharedTexture } from 'three/tsl';

import { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  fractalPixelate,
  updateFractalPixelateUniforms,
} from '../../../../../../lib/tsl/fractalPixelate';

// Wires the fractal-pixelate backdrop technique (webgpu_backdrop_area.html's
// `backdropNode`/`viewportSharedTexture` pattern) onto a NodeMaterial: when
// enabled, the material becomes a fractally-pixelated "window" onto whatever
// renders behind it, same mechanism as the three.js backdrop examples' portal
// meshes. `material` must be a NodeMaterial (e.g. MeshStandardNodeMaterial) —
// `backdropNode` doesn't exist on classic materials.
export default function useBackdropPixelate(
  material,
  {
    enabled,
    cellSize,
    levels,
    threshold,
    noiseScale,
    jitterAmount,
    outlineWidth,
    outlineStrength,
  }
) {
  const uniformsRef = useRef(null);

  useEffect(() => {
    if (!material) return undefined;

    if (!enabled) {
      material.backdropNode = null;
      material.backdropAlphaNode = null;
      material.transparent = false;
      material.needsUpdate = true;
      uniformsRef.current = null;
      return undefined;
    }

    const { colorNode, uniforms } = fractalPixelate(
      (uv) => viewportSharedTexture(viewportSafeUV(uv)),
      {
        cellSize,
        levels,
        threshold,
        noiseScale,
        jitterAmount,
        outlineWidth,
        outlineStrength,
      }
    );
    uniformsRef.current = uniforms;
    material.backdropNode = colorNode;
    material.transparent = true;
    material.needsUpdate = true;

    return () => {
      uniformsRef.current = null;
    };
    // eslint-disable-next-line
  }, [material, enabled]);

  useFrame(() => {
    if (!uniformsRef.current) return;
    updateFractalPixelateUniforms(uniformsRef.current, {
      cellSize,
      levels,
      threshold,
      noiseScale,
      jitterAmount,
      outlineWidth,
      outlineStrength,
    });
  });
}
