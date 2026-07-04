import * as THREE from 'three';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { fbm2, hash01 } from '../utils/noise2d';
import renderTextMask from '../utils/textMask';

const ENDLESS_TILE_RADIUS = 2;
const DEFAULT_ROOT_SEGMENTS = 4;

function sampleTerrainPulse(worldX, worldZ, elapsed, config) {
  const pulseAmplitude = config.terrainPulseAmplitude ?? 0;
  if (pulseAmplitude === 0) {
    return 0;
  }

  const pulseScale = config.terrainPulseScale ?? 0.25;
  const pulseSpeed = config.terrainPulseSpeed ?? 0.35;
  const pulseTime = elapsed * pulseSpeed;
  const primaryWave = Math.sin(
    worldX * (pulseScale * 2.6) + worldZ * (pulseScale * 1.6) + pulseTime
  );
  const secondaryWave = Math.sin(
    worldX * (pulseScale * 1.15) -
      worldZ * (pulseScale * 2.2) -
      pulseTime * 1.35
  );

  return (primaryWave * 0.7 + secondaryWave * 0.45) * pulseAmplitude;
}

function smoothstepCpu(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function buildCarveSampler({ config, heightField }) {
  const showChunkMode = (config.terrainEdgeMode ?? 'chunk') === 'chunk';

  if (showChunkMode) {
    return ({ worldX, worldZ }) => ({
      carve: heightField.sampleCarve(worldX, worldZ),
      height: heightField.sampleHeight(worldX, worldZ),
    });
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

  return ({ worldX, worldZ }) => {
    const u = worldX / worldSpan + 0.5;
    const v = 0.5 - worldZ / worldSpan;
    if (u < 0 || u > 1 || v < 0 || v > 1) {
      return null;
    }

    const carve = textMask.sampleCarveWithXTilt(
      u,
      1 - v,
      config.textTiltX ?? 0
    );
    const hill =
      fbm2(worldX * config.hillFrequency, worldZ * config.hillFrequency, {
        seed: config.seed,
        octaves: 4,
      }) * config.hillAmplitude;
    const pitFloor = config.waterLevel - config.pitDepth;

    return {
      carve,
      height: hill + (pitFloor - hill) * carve,
    };
  };
}

function buildRootPlacements({ config, heightField }) {
  const placements = [];
  const sampleSurface = buildCarveSampler({ config, heightField });
  const showChunkMode = (config.terrainEdgeMode ?? 'chunk') === 'chunk';
  const spanChunks = ENDLESS_TILE_RADIUS * 2 + 1;
  const worldSpan = heightField.worldSize * (showChunkMode ? 1 : spanChunks);
  const half = worldSpan * 0.5;
  const targetRoots = Math.max(0, Math.floor(config.rootCount ?? 180));
  const scanResolution = Math.max(36, Math.round(Math.sqrt(targetRoots) * 6));
  const step = worldSpan / scanResolution;
  const sampleStep = step * 0.5;

  for (let z = 0; z < scanResolution; z += 1) {
    for (let x = 0; x < scanResolution; x += 1) {
      const jitterX = hash01(x, z, config.seed + 1401);
      const jitterZ = hash01(x, z, config.seed + 1423);
      const worldX = -half + (x + jitterX) * step;
      const worldZ = -half + (z + jitterZ) * step;
      const sample = sampleSurface({ worldX, worldZ });

      if (sample) {
        const { carve } = sample;
        if (carve >= 0 && carve <= 0.2) {
          const sampleL = sampleSurface({
            worldX: worldX - sampleStep,
            worldZ,
          });
          const sampleR = sampleSurface({
            worldX: worldX + sampleStep,
            worldZ,
          });
          const sampleD = sampleSurface({
            worldX,
            worldZ: worldZ - sampleStep,
          });
          const sampleU = sampleSurface({
            worldX,
            worldZ: worldZ + sampleStep,
          });

          if (sampleL && sampleR && sampleD && sampleU) {
            const gradX = sampleR.carve - sampleL.carve;
            const gradZ = sampleU.carve - sampleD.carve;
            const gradLen = Math.sqrt(gradX * gradX + gradZ * gradZ);

            if (gradLen >= 0.01) {
              const rimBand = 1 - smoothstepCpu(0.02, 0.16, carve);
              const score = gradLen * rimBand;

              if (score > 0.00035) {
                placements.push({
                  carve,
                  height: sample.height,
                  score,
                  worldX,
                  worldZ,
                  dirX: gradX / gradLen,
                  dirZ: gradZ / gradLen,
                  phase: hash01(x, z, config.seed + 1501) * Math.PI * 2,
                  width: 0.95 + hash01(x, z, config.seed + 1511) * 0.75,
                });
              }
            }
          }
        }
      }
    }
  }

  placements.sort((a, b) => b.score - a.score);
  return placements.slice(0, targetRoots);
}

function Roots({ config, heightField }) {
  const meshRef = useRef(null);
  const placements = useMemo(
    () => buildRootPlacements({ config, heightField }),
    [config, heightField]
  );
  const temp = useMemo(() => new THREE.Object3D(), []);
  const rootGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.38, 0.52, 1, 8, 1),
    []
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    mesh.count = placements.length * DEFAULT_ROOT_SEGMENTS;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.needsUpdate = true;
  }, [placements]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    const elapsed = clock.getElapsedTime();
    const windDir = new THREE.Vector2(
      config.windDirX ?? 1,
      config.windDirZ ?? 0.35
    );
    if (windDir.lengthSq() < 1e-6) {
      windDir.set(1, 0);
    } else {
      windDir.normalize();
    }
    const windStrength = (config.windStrength ?? 0.35) * 0.08;
    const windSpeed =
      (config.windSpeed ?? 0.7) * (config.globalMotionSpeed ?? 1);
    const up = new THREE.Vector3(0, 1, 0);
    let instanceIndex = 0;

    placements.forEach((placement) => {
      const terrainPulse = sampleTerrainPulse(
        placement.worldX,
        placement.worldZ,
        elapsed,
        config
      );
      const base = new THREE.Vector3(
        placement.worldX,
        placement.height + terrainPulse - 0.06,
        placement.worldZ
      );
      const rootDown = new THREE.Vector3(0, -1, 0);
      const wallBias = new THREE.Vector3(
        placement.dirX * 0.16,
        -0.42 - placement.carve * 0.18,
        placement.dirZ * 0.16
      );
      const sideways = new THREE.Vector3(
        -placement.dirZ,
        0,
        placement.dirX
      ).multiplyScalar(0.06 + placement.width * 0.03);
      const windLean = new THREE.Vector3(
        windDir.x * Math.sin(elapsed * (0.5 + windSpeed) + placement.phase),
        0,
        windDir.y * Math.cos(elapsed * (0.45 + windSpeed) + placement.phase)
      ).multiplyScalar(windStrength * placement.width * 0.7);

      const bend0 = rootDown
        .clone()
        .add(wallBias.clone().multiplyScalar(0.85))
        .add(sideways)
        .add(windLean)
        .normalize();
      const bend1 = rootDown
        .clone()
        .add(wallBias.clone().multiplyScalar(0.7))
        .add(sideways.clone().multiplyScalar(0.8))
        .add(windLean.clone().multiplyScalar(0.85))
        .normalize();
      const bend2 = rootDown
        .clone()
        .add(wallBias.clone().multiplyScalar(0.5))
        .add(sideways.clone().multiplyScalar(0.6))
        .add(windLean.clone().multiplyScalar(0.6))
        .normalize();
      const bend3 = rootDown
        .clone()
        .add(wallBias.clone().multiplyScalar(0.35))
        .add(sideways.clone().multiplyScalar(0.45))
        .add(windLean.clone().multiplyScalar(0.4))
        .normalize();

      const totalLength =
        (config.rootLength ?? 1.05) * (0.65 + placement.width * 0.22);
      const segmentLengths = [0.22, 0.26, 0.27, 0.25].map(
        (ratio, index) => totalLength * ratio * (1 - index * 0.04)
      );
      const segmentDirections = [bend0, bend1, bend2, bend3];
      const segmentPoints = [base.clone()];

      segmentDirections.forEach((direction, index) => {
        const start = segmentPoints[index];
        const curlStrength = (config.rootCurl ?? 0.38) * 0.04 * (index + 1);
        const strandNoise = new THREE.Vector3(
          Math.sin(elapsed * 1.35 + placement.phase + index * 1.7),
          Math.sin(elapsed * 1.8 + placement.phase * 0.7 + index * 1.2) * 0.45,
          Math.cos(elapsed * 1.15 + placement.phase + index * 1.9)
        ).multiplyScalar(curlStrength * placement.width);
        const noisyDirection = direction.clone().add(strandNoise).normalize();
        const end = start
          .clone()
          .add(noisyDirection.multiplyScalar(segmentLengths[index]));
        segmentPoints.push(end);

        temp.position.copy(start.clone().add(end).multiplyScalar(0.5));
        temp.quaternion.setFromUnitVectors(
          up,
          end.clone().sub(start).normalize()
        );
        const taper = 1 - index * 0.18;
        const thickness = (config.rootThickness ?? 0.009) * taper;
        temp.scale.set(thickness, segmentLengths[index], thickness * 0.88);
        temp.updateMatrix();
        mesh.setMatrixAt(instanceIndex, temp.matrix);
        instanceIndex += 1;
      });
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!placements.length) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        rootGeometry,
        undefined,
        placements.length * DEFAULT_ROOT_SEGMENTS,
      ]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={new THREE.Color(config.rootTint ?? '#efe4c6')}
        roughness={1}
        metalness={0}
        emissive={new THREE.Color('#20180c')}
        emissiveIntensity={0.08}
      />
    </instancedMesh>
  );
}

export default memo(Roots);
