import { MarchingCubes } from 'three-stdlib';
import * as THREE from 'three/webgpu';

import React, { useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import createLiquidMaterial from '../utils/LiquidMaterial';
import { MC_POS, MC_SCALE, evaluateField } from '../utils/MCField';

// 32³ = 32 768 cells — 3.4× faster than 48³ with still-smooth drips.
// Raise to 40 once you have a GPU-side field or worker offload.
const RESOLUTION = 32;
const MAX_POLY_COUNT = 30000;

// Only rebuild the isosurface every N render frames.
// Animation stays smooth because palette uniforms update every frame;
// only the geometry lags slightly (imperceptible at SKIP=2, noticeable at 4+).
const FIELD_SKIP = 2;

// Scratch color objects — avoids allocation in useFrame.
const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

export default function DrippingSkullMC({ config }) {
  const { mc, mat } = useMemo(() => {
    const matInstance = createLiquidMaterial();
    const mcInstance = new MarchingCubes(
      RESOLUTION,
      matInstance,
      false,
      false,
      MAX_POLY_COUNT
    );
    return { mc: mcInstance, mat: matInstance };
  }, []);

  // Frame counter ref — tracks how many render frames have elapsed.
  const frameRef = React.useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Always sync palette uniforms so color/glow animates at full rate.
    const u = mat.liquidUniforms;
    const ca = tmpA.set(config.tintA);
    const cb = tmpB.set(config.tintB);
    u.paletteA.value.setRGB(
      (ca.r + cb.r) * 0.5,
      (ca.g + cb.g) * 0.5,
      (ca.b + cb.b) * 0.5
    );
    u.paletteB.value.setRGB(
      Math.abs(cb.r - ca.r) * 0.5,
      Math.abs(cb.g - ca.g) * 0.5,
      Math.abs(cb.b - ca.b) * 0.5
    );
    u.paletteBrightness.value = config.paletteBrightness;
    u.paletteSpeed.value = config.paletteSpeed;

    // Rebuild isosurface only every FIELD_SKIP frames.
    frameRef.current += 1;
    if (frameRef.current % FIELD_SKIP !== 0) return;

    mc.reset();
    evaluateField(
      mc.field,
      mc.size,
      mc.size2,
      mc.halfsize,
      t,
      config.shapeMode,
      config
    );
    mc.update();
  });

  return <primitive object={mc} scale={MC_SCALE} position={MC_POS} />;
}
