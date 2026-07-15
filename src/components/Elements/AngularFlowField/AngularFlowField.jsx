import * as THREE from 'three';

import React, { memo, useEffect, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import AngularFlowFieldEngine from './angularFlowFieldEngine';
import {
  createTrailScratch,
  writePointsGeometry,
  writeTubeGeometry,
} from './trailGeometryBuilder';

const MAX_DELTA = 0.05;
const REBUILD_DEBOUNCE_MS = 300;

// Structural props reallocate every buffer (engine + geometry scratch) — kept
// separate from the dynamic props below so tweaking noise/color doesn't
// trigger a rebuild, only actually-structural changes do.
function pickStructuralSettings(props) {
  return {
    emitterCountX: props.emitterCountX,
    emitterCountY: props.emitterCountY,
    emitterCountZ: props.emitterCountZ,
    spacingX: props.spacingX,
    spacingY: props.spacingY,
    spacingZ: props.spacingZ,
    length: props.length,
    discreteResolution: props.discreteResolution,
    renderMode: props.renderMode,
    seed: props.seed,
  };
}

function pickDynamicSettings(props) {
  return {
    loopEnabled: props.loopEnabled,
    generationDistance: props.generationDistance,
    noiseScale: props.noiseScale,
    noiseSpeed: props.noiseSpeed,
    noiseStrength: props.noiseStrength,
    octaves: props.octaves,
    lacunarity: props.lacunarity,
    gain: props.gain,
    warpStrength: props.warpStrength,
    warpScale: props.warpScale,
    vorticity: props.vorticity,
    attraction: props.attraction,
    repulsion: props.repulsion,
    alignmentStrength: props.alignmentStrength,
    alignmentRadius: props.alignmentRadius,
    divergenceStrength: props.divergenceStrength,
    divergenceRadius: props.divergenceRadius,
    damping: props.damping,
  };
}

function createMaterial(renderMode) {
  if (renderMode === 'tube') {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });
  }
  return new THREE.PointsMaterial({
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// Tube mode's geometry only covers segments once a trail has 2+ points
// (see writeTubeGeometry), so a fresh/short trail renders nothing at its
// origin — this marker layer keeps the emitter grid visibly seeded from the
// start, with tube ribbons growing outward from each dot as trails extend.
function createOriginMarkers(origins, color, size) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(origins, 3));
  const material = new THREE.PointsMaterial({
    color,
    size,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return { points, geometry, material };
}

// Bounded, curl-noise-driven angular flow field: a grid of emitters trail
// blocky, discrete-direction-snapped strands, capped at `length` points each
// (respawn from origin if `loopEnabled`, freeze in place otherwise — never
// the unbounded growth of the ported reference). CPU simulation + a standard
// Points/Mesh material, so it renders correctly under both WebGL and WebGPU
// with no renderer-specific code (see AngularFlowField/ plan notes).
function AngularFlowField({
  animationEnabled = true,
  length = 48,
  loopEnabled = true,
  renderMode = 'tube',
  emitterCountX = 5,
  emitterCountY = 3,
  emitterCountZ = 5,
  spacingX = 1.2,
  spacingY = 1.2,
  spacingZ = 1.2,
  generationDistance = 0.35,
  discreteResolution = 4,
  noiseScale = 0.35,
  noiseSpeed = 0.6,
  noiseStrength = 1.2,
  octaves = 3,
  lacunarity = 2,
  gain = 0.5,
  warpStrength = 0,
  warpScale = 1.2,
  vorticity = 1,
  attraction = 0.25,
  repulsion = 0.1,
  alignmentStrength = 0.4,
  alignmentRadius = 1.5,
  divergenceStrength = 0,
  divergenceRadius = 1.5,
  damping = 0.985,
  seed = 1,
  colorMode = 'age',
  colorStart = '#3fd0ff',
  colorEnd = '#a742ff',
  curvatureContrast = 1,
  curvatureBias = 0,
  gradientBlur = 0.35,
  thicknessMin = 1,
  thicknessMax = 3,
  thicknessSeed = 7,
  pointSize = 0.045,
  emissiveIntensity = 1.2,
  roughness = 0.5,
  metalness = 0.1,
  opacity = 1,
  ...groupProps
}) {
  const props = {
    animationEnabled,
    length,
    loopEnabled,
    renderMode,
    emitterCountX,
    emitterCountY,
    emitterCountZ,
    spacingX,
    spacingY,
    spacingZ,
    generationDistance,
    discreteResolution,
    noiseScale,
    noiseSpeed,
    noiseStrength,
    octaves,
    lacunarity,
    gain,
    warpStrength,
    warpScale,
    vorticity,
    attraction,
    repulsion,
    alignmentStrength,
    alignmentRadius,
    divergenceStrength,
    divergenceRadius,
    damping,
    seed,
  };

  const engineRef = useRef(null);
  const scratchRef = useRef(null);
  const materialRef = useRef(null);
  const originMarkersRef = useRef(null);
  const [renderObject, setRenderObject] = useState(null);

  // Rebuilding reallocates the engine's buffers and the geometry scratch —
  // debounce the structural knobs, same pattern as Windswept's LeafSwarm.
  const [structural, setStructural] = useState(() =>
    pickStructuralSettings(props)
  );
  useEffect(() => {
    const id = setTimeout(() => {
      const next = pickStructuralSettings(props);
      setStructural((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      );
    }, REBUILD_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [
    emitterCountX,
    emitterCountY,
    emitterCountZ,
    spacingX,
    spacingY,
    spacingZ,
    length,
    discreteResolution,
    renderMode,
    seed,
  ]);

  useEffect(() => {
    const engine = new AngularFlowFieldEngine({
      ...structural,
      ...pickDynamicSettings(props),
    });
    const scratch = createTrailScratch({
      emitterCount: engine.emitterCount,
      trailCapacity: engine.trailCapacity,
      renderMode: structural.renderMode,
    });
    const material = createMaterial(structural.renderMode);
    const object =
      structural.renderMode === 'tube'
        ? new THREE.Mesh(scratch.geometry, material)
        : new THREE.Points(scratch.geometry, material);
    object.frustumCulled = false;
    // Points has no normals/lit surface to meaningfully receive shadows and
    // isn't a great shadow-caster shape either — only the tube mesh (a real
    // lit MeshStandardMaterial surface) casts/receives.
    if (structural.renderMode === 'tube') {
      object.castShadow = true;
      object.receiveShadow = true;
    }

    engineRef.current = engine;
    scratchRef.current = scratch;
    materialRef.current = material;

    let originMarkers = null;
    let root = object;
    if (structural.renderMode === 'tube') {
      originMarkers = createOriginMarkers(
        engine.getEmitterOrigins(),
        colorStart,
        pointSize
      );
      root = new THREE.Group();
      root.add(originMarkers.points, object);
    }
    originMarkersRef.current = originMarkers;
    setRenderObject(root);

    return () => {
      scratch.geometry.dispose();
      material.dispose();
      if (originMarkers) {
        originMarkers.geometry.dispose();
        originMarkers.material.dispose();
      }
    };
  }, [structural]);

  // Mutable material properties update in place — no material recreation on
  // every color/shading tweak.
  useEffect(() => {
    const material = materialRef.current;
    if (!material) {
      return;
    }
    material.opacity = opacity;
    material.transparent =
      structural.renderMode === 'tube' ? opacity < 1 : true;
    if (structural.renderMode === 'tube') {
      material.roughness = roughness;
      material.metalness = metalness;
      material.emissive.set(colorStart);
      material.emissiveIntensity = emissiveIntensity;
      if (originMarkersRef.current) {
        originMarkersRef.current.material.color.set(colorStart);
        originMarkersRef.current.material.size = pointSize;
      }
    } else {
      material.size = pointSize;
    }
    material.needsUpdate = true;
  }, [
    renderObject,
    structural.renderMode,
    opacity,
    roughness,
    metalness,
    colorStart,
    emissiveIntensity,
    pointSize,
  ]);

  useFrame((_state, rawDelta) => {
    const engine = engineRef.current;
    const scratch = scratchRef.current;
    if (!engine || !scratch) {
      return;
    }

    engine.updateSettings(pickDynamicSettings(props));

    let changed = false;
    if (animationEnabled) {
      const delta = Math.min(Math.max(rawDelta, 1e-4), MAX_DELTA);
      ({ changed } = engine.step(delta));
    }

    if (changed) {
      const paletteSettings = {
        colorMode,
        colorStart,
        colorEnd,
        curvatureContrast,
        curvatureBias,
        gradientBlur,
      };
      const state = engine.getTrailStateView();
      if (structural.renderMode === 'tube') {
        writeTubeGeometry(
          state,
          { thicknessMin, thicknessMax, thicknessSeed },
          paletteSettings,
          scratch
        );
      } else {
        writePointsGeometry(state, paletteSettings, scratch);
      }
    }
  });

  if (!renderObject) {
    return null;
  }

  return <primitive object={renderObject} {...groupProps} />;
}

export default memo(AngularFlowField);
