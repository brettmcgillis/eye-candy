/* eslint-disable camelcase */
import {
  attribute,
  mix,
  mx_noise_float,
  positionWorld,
  smoothstep,
  texture,
  time,
  transformNormalToView,
  uniform,
  uv,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import { fbm2 } from '../utils/noise2d';
import renderTextMask from '../utils/textMask';

const FOAM_COLOR = new THREE.Color('#e3efe9');
const ENDLESS_TILE_RADIUS = 2;
const OUTER_WATER_SEGMENTS = 96;

function smoothstepCpu(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function buildOuterWaterGeometry({
  carveSampler,
  chunkSize,
  hillAmplitude,
  hillFrequency,
  offsetX,
  offsetZ,
  pitFloor,
  seed,
  segments,
}) {
  const geometry = new THREE.PlaneGeometry(
    chunkSize,
    chunkSize,
    segments,
    segments
  );
  const positions = geometry.attributes.position;
  const bedAttr = new Float32Array(positions.count);

  for (let i = 0; i < positions.count; i += 1) {
    const localX = positions.getX(i);
    const localY = positions.getY(i);
    const worldX = localX + offsetX;
    const worldZ = -localY + offsetZ;
    const hill =
      fbm2(worldX * hillFrequency, worldZ * hillFrequency, {
        seed,
        octaves: 4,
      }) * hillAmplitude;
    const carve = carveSampler ? carveSampler(worldX, worldZ) : 0;
    const bed = hill + (pitFloor - hill) * carve;
    bedAttr[i] = bed;
  }

  geometry.setAttribute('outerBedHeight', new THREE.Float32BufferAttribute(bedAttr, 1));
  return geometry;
}

// One flat water table under the whole terrain. The meadow floor is always
// above it, so water is only visible inside the carved letters — taller
// strata walls under hills, shallower under dips, all sharing one level.
// The water samples the shared heightfield for true depth: shallow edges get
// an animated foam ring, deep letter floors shade darker.
function Water({ cloudShade, config, heightField }) {
  const showChunkMode = (config.terrainEdgeMode ?? 'chunk') === 'chunk';

  const endlessCarveSampler = useMemo(() => {
    if (showChunkMode) {
      return null;
    }

    const spanChunks = ENDLESS_TILE_RADIUS * 2 + 1;
    const worldSpan = heightField.worldSize * spanChunks;
    const endlessTextScale = (config.textScale ?? 1) / spanChunks;

    const textMask = renderTextMask({
      edgeSoftness: config.edgeSoftness,
      fontFamily: config.fontFamily,
      fontWeight: config.fontWeight,
      letterSpacing: config.letterSpacing,
      text: config.text,
      textRotation: config.textRotation,
      textScale: endlessTextScale,
    });

    return (worldX, worldZ) => {
      const u = worldX / worldSpan + 0.5;
      const v = 0.5 - worldZ / worldSpan;
      if (u < 0 || u > 1 || v < 0 || v > 1) {
        return 0;
      }
      const mask = textMask.sample(u, 1 - v);
      return smoothstepCpu(0.3, 0.7, mask);
    };
  }, [
    config.edgeSoftness,
    config.fontFamily,
    config.fontWeight,
    config.letterSpacing,
    config.terrainEdgeMode,
    config.text,
    config.textRotation,
    config.textScale,
    heightField.worldSize,
    showChunkMode,
  ]);

  const uniforms = useMemo(
    () => ({
      color: uniform(new THREE.Color(config.waterColor)),
      opacity: uniform(config.waterOpacity),
      rippleScale: uniform(config.rippleScale),
      rippleSpeed: uniform(config.rippleSpeed),
      rippleStrength: uniform(config.rippleStrength),
      waterLine: uniform(config.waterLevel),
    }),
    []
  );

  useEffect(() => {
    uniforms.color.value.set(config.waterColor);
    uniforms.opacity.value = config.waterOpacity;
    uniforms.rippleScale.value = config.rippleScale;
    uniforms.rippleSpeed.value =
      config.rippleSpeed * (config.globalMotionSpeed ?? 1);
    uniforms.rippleStrength.value = config.rippleStrength;
    uniforms.waterLine.value = config.waterLevel;
  }, [
    config.globalMotionSpeed,
    config.rippleScale,
    config.rippleSpeed,
    config.rippleStrength,
    config.waterColor,
    config.waterLevel,
    config.waterOpacity,
    uniforms,
  ]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 0.12,
      transparent: true,
    });

    // Ripple normals from finite differences of a drifting noise field.
    const p = vec3(
      positionWorld.x.mul(uniforms.rippleScale),
      positionWorld.z.mul(uniforms.rippleScale),
      time.mul(uniforms.rippleSpeed)
    );
    const e = 0.12;
    const dx = mx_noise_float(p.add(vec3(e, 0, 0))).sub(
      mx_noise_float(p.sub(vec3(e, 0, 0)))
    );
    const dz = mx_noise_float(p.add(vec3(0, e, 0))).sub(
      mx_noise_float(p.sub(vec3(0, e, 0)))
    );
    mat.normalNode = transformNormalToView(
      vec3(
        dx.mul(uniforms.rippleStrength).negate(),
        dz.mul(uniforms.rippleStrength).negate(),
        1
      ).normalize()
    );

    // True water depth from the shared heightfield (plane uvs match the
    // terrain's world mapping, so field.r is the carved bed height here).
    const bed = texture(heightField.texture, uv()).r;
    const depth = uniforms.waterLine.sub(bed).max(0);

    // Deep letter floors darken toward a sunken version of the water color.
    const depthShade = smoothstep(0.05, 0.9, depth);
    const deepColor = uniforms.color.mul(vec3(0.35, 0.45, 0.5));
    const body = mix(uniforms.color, deepColor, depthShade);

    // Foam ring where the bed nears the surface: a noisy lapping edge plus a
    // fainter second band pulsing just outside it.
    const foamWobble = mx_noise_float(
      vec3(positionWorld.x.mul(5), positionWorld.z.mul(5), time.mul(0.45))
    ).mul(0.06);
    const shore = depth.add(foamWobble);
    const foamEdge = smoothstep(0.16, 0.02, shore);
    const lap = time.mul(1.4).add(positionWorld.x.mul(2.1)).sin().mul(0.02);
    const foamBand = smoothstep(0.3, 0.22, shore.add(lap)).mul(
      smoothstep(0.16, 0.24, shore)
    );
    const foam = foamEdge.add(foamBand.mul(0.35)).clamp(0, 1);

    const foamed = mix(
      body,
      vec3(FOAM_COLOR.r, FOAM_COLOR.g, FOAM_COLOR.b),
      foam.mul(0.85)
    );
    mat.colorNode = foamed.mul(cloudShade(positionWorld.xz));

    // Foam reads more solid; deep water slightly more opaque too.
    mat.opacityNode = uniforms.opacity
      .add(foam.mul(0.3))
      .add(depthShade.mul(0.1))
      .min(1);

    return mat;
  }, [cloudShade, heightField.texture, uniforms]);

  const endlessOuterMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 0.12,
      transparent: true,
    });

    const p = vec3(
      positionWorld.x.mul(uniforms.rippleScale),
      positionWorld.z.mul(uniforms.rippleScale),
      time.mul(uniforms.rippleSpeed)
    );
    const e = 0.12;
    const dx = mx_noise_float(p.add(vec3(e, 0, 0))).sub(
      mx_noise_float(p.sub(vec3(e, 0, 0)))
    );
    const dz = mx_noise_float(p.add(vec3(0, e, 0))).sub(
      mx_noise_float(p.sub(vec3(0, e, 0)))
    );
    mat.normalNode = transformNormalToView(
      vec3(
        dx.mul(uniforms.rippleStrength).negate(),
        dz.mul(uniforms.rippleStrength).negate(),
        1
      ).normalize()
    );

    const bed = attribute('outerBedHeight');
    const depth = uniforms.waterLine.sub(bed).max(0);

    const depthShade = smoothstep(0.05, 0.9, depth);
    const deepColor = uniforms.color.mul(vec3(0.35, 0.45, 0.5));
    const body = mix(uniforms.color, deepColor, depthShade);

    const foamWobble = mx_noise_float(
      vec3(positionWorld.x.mul(5), positionWorld.z.mul(5), time.mul(0.45))
    ).mul(0.06);
    const shore = depth.add(foamWobble);
    const foamEdge = smoothstep(0.16, 0.02, shore);
    const lap = time.mul(1.4).add(positionWorld.x.mul(2.1)).sin().mul(0.02);
    const foamBand = smoothstep(0.3, 0.22, shore.add(lap)).mul(
      smoothstep(0.16, 0.24, shore)
    );
    const foam = foamEdge.add(foamBand.mul(0.35)).clamp(0, 1);

    const foamed = mix(
      body,
      vec3(FOAM_COLOR.r, FOAM_COLOR.g, FOAM_COLOR.b),
      foam.mul(0.85)
    );
    mat.colorNode = foamed.mul(cloudShade(positionWorld.xz));

    const visibleWater = smoothstep(0.02, 0.08, depth);
    mat.opacityNode = uniforms.opacity
      .add(foam.mul(0.3))
      .add(depthShade.mul(0.1))
      .mul(visibleWater)
      .min(1);

    return mat;
  }, [cloudShade, uniforms]);

  const outerTiles = useMemo(() => {
    if (showChunkMode) {
      return [];
    }

    const tiles = [];
    for (let z = -ENDLESS_TILE_RADIUS; z <= ENDLESS_TILE_RADIUS; z += 1) {
      for (let x = -ENDLESS_TILE_RADIUS; x <= ENDLESS_TILE_RADIUS; x += 1) {
        if (x === 0 && z === 0) {
          continue;
        }
        const offsetX = x * heightField.worldSize;
        const offsetZ = z * heightField.worldSize;
        tiles.push({
          geometry: buildOuterWaterGeometry({
            carveSampler: endlessCarveSampler,
            chunkSize: heightField.worldSize,
            hillAmplitude: config.hillAmplitude,
            hillFrequency: config.hillFrequency,
            offsetX,
            offsetZ,
            pitFloor: config.waterLevel - config.pitDepth,
            seed: config.seed,
            segments: OUTER_WATER_SEGMENTS,
          }),
          key: `${offsetX}:${offsetZ}`,
          position: [offsetX, config.waterLevel, offsetZ],
        });
      }
    }

    return tiles;
  }, [
    config.hillAmplitude,
    config.hillFrequency,
    config.pitDepth,
    config.seed,
    config.terrainEdgeMode,
    config.waterLevel,
    endlessCarveSampler,
    heightField.worldSize,
    showChunkMode,
  ]);

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => endlessOuterMaterial.dispose(), [endlessOuterMaterial]);
  useEffect(
    () => () => {
      outerTiles.forEach((tile) => tile.geometry.dispose());
    },
    [outerTiles]
  );

  return (
    <group>
      <mesh
        material={material}
        position-y={config.waterLevel}
        receiveShadow
        rotation-x={-Math.PI / 2}
      >
        <planeGeometry
          args={[heightField.worldSize * 0.999, heightField.worldSize * 0.999]}
        />
      </mesh>
      {!showChunkMode &&
        outerTiles.map((tile) => (
          <mesh
            key={tile.key}
            geometry={tile.geometry}
            material={endlessOuterMaterial}
            position={tile.position}
            receiveShadow
            rotation-x={-Math.PI / 2}
          />
        ))}
    </group>
  );
}

export default memo(Water);
