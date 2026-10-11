import React, { memo, useEffect, useRef, useState } from 'react';

import { useThree } from '@react-three/fiber';

import {
  buildVoxelObject,
  disposeVoxelMeshes,
  pickStructuralSettings,
  rebakeVoxelObject,
  updateVoxelMaterials,
} from '@modules/fractalAutomataRender';

const REBUILD_DEBOUNCE_MS = 300;

// Owns the build lifecycle around @modules/fractalAutomataRender's
// buildVoxelObject: debounced regenerate on structural changes, a rebake when
// only baked-in settings move (visibility, bounds, palette colours), and live
// material uniforms otherwise. The structure always resolves instantly.
function VoxelField({ config }) {
  const { gl } = useThree();
  const builtRef = useRef(null);
  // Disposed only once a later build replaces it (or on unmount): the build
  // effect's own cleanup fires the instant `structural` changes, well before
  // the replacement is on screen.
  const activeRef = useRef(null);
  // The CA field survives a detail-only regenerate: same CA settings, same
  // cells, so the most expensive step is skipped.
  const cacheRef = useRef(null);
  const [renderObject, setRenderObject] = useState(null);
  // Read by the rebake effect so a fresh renderObject from a regenerate does
  // not retrigger it on top of the bake the build just did.
  const renderObjectRef = useRef(null);

  const [structural, setStructural] = useState(() =>
    pickStructuralSettings(config)
  );
  useEffect(() => {
    const id = setTimeout(() => {
      const next = pickStructuralSettings(config);
      setStructural((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      );
    }, REBUILD_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [
    config.level,
    config.seed,
    config.baseFill,
    config.ruleMode,
    config.density,
    config.beta,
    config.magnetism,
    config.flipChance,
    config.removeStrays,
    config.growthJitter,
    config.detailEnhanceEnabled,
    config.subdivisionLevels,
    config.subdivisionCoverageBoost,
    config.detailThreshold,
    config.detailAltitudeVariance,
    config.detailThresholdHigh,
    config.detailMinSharpness,
    config.erosionCoverage,
    config.growthCoverage,
    config.state1Clearcoat,
    config.state2Clearcoat,
    config.state3Clearcoat,
    config.state1Transmission,
    config.state2Transmission,
    config.state3Transmission,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function build() {
      const built = await buildVoxelObject({
        gl,
        structural,
        config,
        cache: cacheRef,
        isCancelled: () => cancelled,
      });
      if (!built) return;

      builtRef.current = built;
      renderObjectRef.current = built.group;
      setRenderObject(built.group);

      const previous = activeRef.current;
      activeRef.current = built;
      if (previous) disposeVoxelMeshes(previous);
    }

    build();

    return () => {
      cancelled = true;
      builtRef.current = null;
    };
  }, [structural, gl]);

  useEffect(
    () => () => {
      if (activeRef.current) disposeVoxelMeshes(activeRef.current);
    },
    []
  );

  useEffect(() => {
    if (builtRef.current) updateVoxelMaterials({ ...builtRef.current, config });
  }, [
    config.state1Roughness,
    config.state1Metalness,
    config.state1EmissiveColor,
    config.state1EmissiveIntensity,
    config.state1Clearcoat,
    config.state1ClearcoatRoughness,
    config.state1Transmission,
    config.state1Ior,
    config.state1Thickness,
    config.state2Roughness,
    config.state2Metalness,
    config.state2EmissiveColor,
    config.state2EmissiveIntensity,
    config.state2Clearcoat,
    config.state2ClearcoatRoughness,
    config.state2Transmission,
    config.state2Ior,
    config.state2Thickness,
    config.state3Roughness,
    config.state3Metalness,
    config.state3EmissiveColor,
    config.state3EmissiveIntensity,
    config.state3Clearcoat,
    config.state3ClearcoatRoughness,
    config.state3Transmission,
    config.state3Ior,
    config.state3Thickness,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function rebake() {
      const built = builtRef.current;
      if (!built) return;
      const baked = await rebakeVoxelObject({
        gl,
        state: built.state,
        config,
        isCancelled: () => cancelled,
      });
      if (!baked) return;

      const group = renderObjectRef.current;
      group.remove(built.staticMesh, ...built.tierMeshes);
      group.add(baked.staticMesh, ...baked.tierMeshes);
      disposeVoxelMeshes(built);
      Object.assign(built, baked);
    }

    rebake();

    return () => {
      cancelled = true;
    };
  }, [
    gl,
    config.showState1,
    config.showState2,
    config.showState3,
    config.boundsShape,
    config.boundsSphereRadius,
    config.paletteStart,
    config.paletteMid,
    config.paletteEnd,
    config.paletteName,
    config.paletteExact,
    config.debugTierColors,
  ]);

  if (!renderObject) {
    return null;
  }

  return <primitive object={renderObject} />;
}

export default memo(VoxelField);
