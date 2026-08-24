import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { DestructibleMesh, SliceOptions } from '@dgreenheck/three-pinata';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { Box3, Color, Matrix4, Vector3 } from 'three';
import { normalMap, texture, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';
import { rust } from 'tsl-textures';

import { modelFile } from '@utils/appUtils';

const MODEL = modelFile('horse_statue.glb');
useGLTF.preload(MODEL);

const UP = new Vector3(0, 1, 0);
const sliceOpts = new SliceOptions();

function keepAbove(pieces, cutY) {
  const box = new Box3();
  return pieces.filter((p) => {
    box.setFromObject(p);
    return (box.min.y + box.max.y) / 2 > cutY;
  });
}

function keepBelow(pieces, cutY) {
  const box = new Box3();
  return pieces.filter((p) => {
    box.setFromObject(p);
    return (box.min.y + box.max.y) / 2 <= cutY;
  });
}

// Each band is extracted independently with two fresh cuts on the original
// geometry (ceiling cut + floor cut). Sequential slicing causes disconnected
// pieces (4 legs, etc.) to multiply across subsequent cuts and cluster.
function sliceIntoBands(geometry, bandCount, yMin, yMax, outerMat, innerMat) {
  const bandH = (yMax - yMin) / bandCount;

  return Array.from({ length: bandCount }, (_, i) => {
    const yLo = yMin + i * bandH;
    const yHi = yMin + (i + 1) * bandH;

    let pieces = [new DestructibleMesh(geometry.clone(), outerMat, innerMat)];

    if (i < bandCount - 1) {
      pieces = pieces.flatMap((p) =>
        keepBelow(p.slice(UP, new Vector3(0, yHi, 0), sliceOpts), yHi)
      );
    }

    if (i > 0) {
      pieces = pieces.flatMap((p) =>
        keepAbove(p.slice(UP, new Vector3(0, yLo, 0), sliceOpts), yLo)
      );
    }

    return pieces;
  });
}

// mix(color, background, k): k=0 → color, k=1 → background, k>1 extrapolates.
// Raw k from the noise loop ≈ 3. xamount = rustAmount * ~4.5 is subtracted:
//   Positive rustAmount → k shrinks toward 0 → more baseColor → polished look
//   Negative rustAmount → k grows past 1 → extrapolates past patinaColor into heavy patina
//
// amount and scale accept TSL uniform nodes so they can be updated per-frame
// without rebuilding the material.
function makeOuterMat(
  rustAmountU,
  rustScaleU,
  metalness,
  roughness,
  baseColor,
  patinaColor,
  rustIterations,
  rustNoise,
  rustNoiseScale,
  rustSeed,
  originalMat
) {
  const mat = new THREE.MeshStandardNodeMaterial({
    colorNode: rust({
      color: new Color(baseColor),
      background: new Color(patinaColor),
      amount: rustAmountU,
      scale: rustScaleU,
      iterations: rustIterations,
      noise: rustNoise,
      noiseScale: rustNoiseScale,
      seed: rustSeed,
    }),
    metalness,
    roughness,
  });
  if (originalMat?.normalMap) {
    mat.normalNode = normalMap(texture(originalMat.normalMap));
  }
  return mat;
}

function makeInnerMat(
  innerRustAmountU,
  innerRustScaleU,
  innerMetalness,
  innerRoughness,
  innerColor,
  baseColor,
  innerIterations,
  innerNoise,
  innerNoiseScale,
  innerSeed
) {
  return new THREE.MeshStandardNodeMaterial({
    colorNode: rust({
      color: new Color(innerColor),
      background: new Color(baseColor),
      amount: innerRustAmountU,
      scale: innerRustScaleU,
      iterations: innerIterations,
      noise: innerNoise,
      noiseScale: innerNoiseScale,
      seed: innerSeed,
    }),
    metalness: innerMetalness,
    roughness: innerRoughness,
  });
}

// Compute average energy for a range of bands [lo, hi)
function bandEnergy(audio, lo, hi) {
  let sum = 0;
  const count = hi - lo;
  for (let i = lo; i < hi; i += 1) sum += audio[i];
  return sum / count;
}

function BandedHorse({
  audioMode,
  rustAudioDepth,
  bandCount,
  sensitivity,
  metalness,
  roughness,
  rustAmount,
  rustScale,
  rustIterations,
  rustNoise,
  rustNoiseScale,
  rustSeed,
  baseColor,
  patinaColor,
  innerMetalness,
  innerRoughness,
  innerRustAmount,
  innerRustScale,
  innerIterations,
  innerNoise,
  innerNoiseScale,
  innerSeed,
  innerColor,
  bandsRef,
}) {
  const { scene } = useGLTF(MODEL);
  const groupRefs = useRef([]);
  const [bandData, setBandData] = useState(null);
  const originalMatRef = useRef(null);

  // Stable TSL uniform nodes — passed into rust() so the shader reads live values
  // without triggering material rebuilds. Created once; .value updated each frame.
  const rustAmountU = useMemo(() => uniform(rustAmount), []);
  const rustScaleU = useMemo(() => uniform(rustScale), []);
  const innerRustAmountU = useMemo(() => uniform(innerRustAmount), []);
  const innerRustScaleU = useMemo(() => uniform(innerRustScale), []);

  // Track base (control) values so audio drives relative to them
  const baseRustRef = useRef({
    rustAmount,
    rustScale,
    innerRustAmount,
    innerRustScale,
  });
  useEffect(() => {
    baseRustRef.current = {
      rustAmount,
      rustScale,
      innerRustAmount,
      innerRustScale,
    };
    // In slices-only mode keep uniforms locked to the control values
    if (audioMode === 'slices') {
      rustAmountU.value = rustAmount;
      rustScaleU.value = rustScale;
      innerRustAmountU.value = innerRustAmount;
      innerRustScaleU.value = innerRustScale;
    }
  }, [
    rustAmount,
    rustScale,
    innerRustAmount,
    innerRustScale,
    audioMode,
    rustAmountU,
    rustScaleU,
    innerRustAmountU,
    innerRustScaleU,
  ]);

  // Minimum thickness per band that three-pinata can cut reliably.
  // Below ~0.045 units the CSG precision fails and top bands collapse together.
  // SLICE_HEIGHT grows with bandCount so each band always clears the threshold.
  // displayScale compensates so the horse renders at a constant 2-unit height.
  // The displacement formula uses `range` (= SLICE_HEIGHT) and multiplies by
  // displayScale, so the visual displacement stays constant regardless of bandCount.
  const MIN_BAND_THICKNESS = 0.06;
  const SLICE_HEIGHT = Math.max(5, bandCount * MIN_BAND_THICKNESS);
  const displayScale = 5 / SLICE_HEIGHT;

  const horseGeo = useMemo(() => {
    let found = null;
    scene.updateWorldMatrix(true, true);
    scene.traverse((child) => {
      if (child.isMesh && !found) found = child;
    });
    if (!found) return null;
    originalMatRef.current = Array.isArray(found.material)
      ? found.material[0]
      : found.material;
    const geo = found.geometry.clone();
    geo.applyMatrix4(found.matrixWorld);
    geo.computeBoundingBox();
    const currentH = geo.boundingBox.max.y - geo.boundingBox.min.y;
    const s = SLICE_HEIGHT / currentH;
    geo.applyMatrix4(new Matrix4().makeScale(s, s, s));
    return geo;
    // SLICE_HEIGHT derives from bandCount — re-normalize when bandCount changes
    // (slicing is already re-run on bandCount change and is far more expensive).
  }, [scene, bandCount]);

  const { yMin, yMax } = useMemo(() => {
    horseGeo.computeBoundingBox();
    return {
      yMin: horseGeo.boundingBox.min.y,
      yMax: horseGeo.boundingBox.max.y,
    };
  }, [horseGeo]);

  // Materials use stable uniform nodes for amount/scale (live via .value updates)
  // but rebuild when structural params change: colors, metalness, roughness,
  // iterations, noise, noiseScale, seed.
  const outerMat = useMemo(
    () =>
      makeOuterMat(
        rustAmountU,
        rustScaleU,
        metalness,
        roughness,
        baseColor,
        patinaColor,
        rustIterations,
        rustNoise,
        rustNoiseScale,
        rustSeed,
        originalMatRef.current
      ),
    [
      metalness,
      roughness,
      baseColor,
      patinaColor,
      rustIterations,
      rustNoise,
      rustNoiseScale,
      rustSeed,
    ]
  );
  const innerMat = useMemo(
    () =>
      makeInnerMat(
        innerRustAmountU,
        innerRustScaleU,
        innerMetalness,
        innerRoughness,
        innerColor,
        baseColor,
        innerIterations,
        innerNoise,
        innerNoiseScale,
        innerSeed
      ),
    [
      innerMetalness,
      innerRoughness,
      innerColor,
      baseColor,
      innerIterations,
      innerNoise,
      innerNoiseScale,
      innerSeed,
    ]
  );

  useEffect(() => () => outerMat.dispose(), [outerMat]);
  useEffect(() => () => innerMat.dispose(), [innerMat]);

  // Slice geometry — CPU-intensive, runs once per bandCount change
  useEffect(() => {
    if (!horseGeo || !outerMat || !innerMat) return undefined;

    const bands = sliceIntoBands(
      horseGeo,
      bandCount,
      yMin,
      yMax,
      outerMat,
      innerMat
    );

    const data = bands.map((pieces, bi) => ({
      id: `band-${bi}`,
      geos: pieces.map((p, pi) => ({
        id: `band-${bi}-piece-${pi}`,
        geo: p.geometry,
      })),
    }));

    setBandData(data);

    return () => {
      data.forEach(({ geos }) => geos.forEach(({ geo }) => geo?.dispose()));
    };
  }, [horseGeo, bandCount, outerMat, innerMat, yMin, yMax]);

  const range = yMax - yMin;

  useFrame(() => {
    const audio = bandsRef?.current;
    if (!audio) return;

    const driveSlices = audioMode === 'slices' || audioMode === 'both';
    const driveRust = audioMode === 'rust' || audioMode === 'both';

    if (driveSlices) {
      for (let i = 1; i < groupRefs.current.length; i += 1) {
        const grp = groupRefs.current[i];
        if (grp) grp.position.x = audio[i] * sensitivity * range * 0.45;
      }
    } else {
      // Reset positions when switching away from slice mode
      for (let i = 0; i < groupRefs.current.length; i += 1) {
        const grp = groupRefs.current[i];
        if (grp) grp.position.x = 0;
      }
    }

    if (driveRust) {
      // Bass (bands 0-4) drives overall rust amount — kicks punch patina in/out
      const bass = bandEnergy(audio, 0, 5);
      // High-mids (bands 15-35) drive scale — treble detail shifts texture grain
      const treble = bandEnergy(audio, 15, 35);

      const base = baseRustRef.current;
      const depth = rustAudioDepth;

      rustAmountU.value = base.rustAmount + bass * depth;
      rustScaleU.value = base.rustScale + treble * depth * 3;
      innerRustAmountU.value = base.innerRustAmount + bass * depth * 0.6;
      innerRustScaleU.value = base.innerRustScale + treble * depth * 2;
    }
  });

  if (!bandData) return null;

  return (
    <group scale={displayScale}>
      {bandData.map(({ id, geos }, bandIdx) => (
        <group
          key={id}
          ref={(el) => {
            groupRefs.current[bandIdx] = el;
          }}
        >
          {geos.map(({ id: pieceId, geo }) => (
            <mesh
              key={pieceId}
              geometry={geo}
              material={[outerMat, innerMat]}
              castShadow
              receiveShadow
            />
          ))}
        </group>
      ))}
    </group>
  );
}

export default memo(BandedHorse);
