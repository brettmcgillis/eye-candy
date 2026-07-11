import { instancedArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import usePointerTrailSpawner from '../hooks/usePointerTrailSpawner';
import InstancedTrails from '../utils/trails/InstancedTrails';
import buildWalkGeometry from '../utils/trails/buildWalkGeometry';
import createTrailMaterial, {
  createSharedTrailUniforms,
} from '../utils/trails/createTrailMaterial';
import skinnedPoint from '../utils/trails/skinnedPoint';
import { CurlGenerator } from '../utils/vendor/CurlGenerator';
import { SurfacePoint } from '../utils/vendor/SurfaceWalker';

// Curl-noise trail systems, ported from three-sketches:
// - Interior: free-space walkers inside the bird volume (curl/trails.js) —
//   move along the normalized curl field, random respawn, ribbon trails.
// - Exterior: geodesic surface walkers (surface-flow/interactiveCurl +
//   galacticSurface) — curl direction projected along the surface via
//   SurfaceWalker, life-limited with ambient respawn, plus pointer
//   stroke/burst spawning.
// Both advect in bind-pose space; config.trailSpace decides whether pushed
// vertices are frozen in world space (CPU-skinned at push — smear) or
// re-skinned live on the GPU (ride the surface).

const INTERIOR_SEGMENTS = 256;
const EXTERIOR_SEGMENTS = 512;

const tempV = new THREE.Vector3();
const normalV = new THREE.Vector3();
const worldV = new THREE.Vector3();

function makeSkin() {
  return { si: [0, 0, 0, 0], sw: [0, 0, 0, 0] };
}

function CurlTrails({ config, meshes, birdStateRef }) {
  const groupRef = useRef(new THREE.Group());
  const systemRef = useRef(null);
  const clockRef = useRef(0);

  // Debounced counts — rebuilding allocates ring buffers.
  const [counts, setCounts] = useState({
    interior: config.interiorTrailCount,
    exterior: config.exteriorTrailCount,
  });
  useEffect(() => {
    const id = setTimeout(
      () =>
        setCounts((prev) =>
          prev.interior === config.interiorTrailCount &&
          prev.exterior === config.exteriorTrailCount
            ? prev
            : {
                interior: config.interiorTrailCount,
                exterior: config.exteriorTrailCount,
              }
        ),
      300
    );
    return () => clearTimeout(id);
  }, [config.interiorTrailCount, config.exteriorTrailCount]);

  useEffect(() => {
    if (!meshes) return undefined;

    const group = groupRef.current;
    const walk = buildWalkGeometry(meshes);
    const skeleton = meshes[0].skeleton;
    const boneBuf = instancedArray(skeleton.bones.length * 4, 'vec4');
    const shared = createSharedTrailUniforms();

    const interiorMat = createTrailMaterial({
      boneBuf,
      shared,
      color: config.interiorTrailColor,
      opacity: config.interiorTrailOpacity,
    });
    const exteriorMat = createTrailMaterial({
      boneBuf,
      shared,
      color: config.exteriorTrailColor,
      opacity: config.exteriorTrailOpacity,
    });

    const interiorTrails = new InstancedTrails(
      Math.max(counts.interior, 1),
      INTERIOR_SEGMENTS,
      interiorMat.material
    );
    const exteriorTrails = new InstancedTrails(
      Math.max(counts.exterior, 1),
      EXTERIOR_SEGMENTS,
      exteriorMat.material
    );

    const interiorPoints = [];
    for (let i = 0; i < counts.interior; i += 1) {
      const skin = makeSkin();
      const p = walk.spawnInterior(new THREE.Vector3(), skin, Math.random);
      interiorPoints.push({
        p,
        skin,
        dir: i % 2 === 0 ? 1 : -1,
        needsBreak: true,
      });
    }

    const exteriorPoints = [];
    for (let i = 0; i < counts.exterior; i += 1) {
      const sp = new SurfacePoint();
      sp.index = walk.sampleFaceIndex(Math.random);
      walk.samplePointOnFace(sp.index, sp, Math.random);
      exteriorPoints.push({
        sp,
        skin: makeSkin(),
        direction: new THREE.Vector3(),
        life:
          THREE.MathUtils.lerp(0.2, 1, Math.random()) *
          config.exteriorTrailLife,
        dir: i % 2 === 0 ? 1 : -1,
        needsBreak: true,
      });
    }

    group.add(interiorTrails);
    group.add(exteriorTrails);

    systemRef.current = {
      walk,
      skeleton,
      boneBuf,
      shared,
      curlInterior: new CurlGenerator(),
      curlExterior: new CurlGenerator(),
      interior: {
        trails: interiorTrails,
        mat: interiorMat,
        points: interiorPoints,
      },
      exterior: {
        trails: exteriorTrails,
        mat: exteriorMat,
        points: exteriorPoints,
        cursor: 0,
      },
    };

    return () => {
      group.remove(interiorTrails);
      group.remove(exteriorTrails);
      interiorTrails.dispose();
      exteriorTrails.dispose();
      interiorMat.material.dispose();
      exteriorMat.material.dispose();
      walk.dispose();
      systemRef.current = null;
    };
    // Colors/opacity are updated per-frame; only structure params rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meshes, counts]);

  // Switching trail space invalidates every stored vertex (different
  // coordinate space) — wipe and restart the ribbons.
  useEffect(() => {
    const sys = systemRef.current;
    if (!sys) return;
    sys.interior.trails.reset();
    sys.exterior.trails.reset();
    sys.interior.points.forEach((info) => {
      info.needsBreak = true; // eslint-disable-line no-param-reassign
    });
    sys.exterior.points.forEach((info) => {
      info.needsBreak = true; // eslint-disable-line no-param-reassign
    });
  }, [config.trailSpace]);

  const handleSpawn = useCallback(
    (point, faceIndex) => {
      const sys = systemRef.current;
      if (!sys || sys.exterior.points.length === 0) return;
      const ext = sys.exterior;
      // Two trails per hit, one walking each field direction (1:1 with
      // interactiveCurl's paired triggers).
      for (let k = 0; k < 2; k += 1) {
        ext.cursor = (ext.cursor + 1) % ext.points.length;
        const info = ext.points[ext.cursor];
        info.sp.copy(point);
        info.sp.index = faceIndex;
        info.life = config.exteriorTrailLife + Math.random() * 0.5;
        info.needsBreak = true;
      }
    },
    [config.exteriorTrailLife]
  );

  usePointerTrailSpawner({
    enabled: config.pointerTrails,
    birdStateRef,
    systemRef,
    onSpawn: handleSpawn,
  });

  useFrame((_, rawDelta) => {
    const sys = systemRef.current;
    const state = birdStateRef.current;
    if (!sys || !state?.fitted) return;

    const dt = Math.min(Math.max(rawDelta, 1e-4), 1 / 30);
    clockRef.current += dt;
    const now = clockRef.current;
    const s = state.normScale || 1;
    const ride = config.trailSpace === 'surface';
    const { boneMatrices } = state;

    sys.shared.currentSec.value = now;
    sys.shared.fadeSec.value = config.trailFade;
    sys.shared.spaceMode.value = ride ? 1 : 0;
    sys.boneBuf.value.array.set(boneMatrices);
    sys.boneBuf.value.needsUpdate = true;

    sys.interior.mat.uniforms.color.value.set(config.interiorTrailColor);
    sys.interior.mat.uniforms.opacity.value = config.interiorTrailOpacity;
    sys.exterior.mat.uniforms.color.value.set(config.exteriorTrailColor);
    sys.exterior.mat.uniforms.opacity.value = config.exteriorTrailOpacity;

    // Controls are expressed in world units; the walkers run in bind space.
    const bindCurlScale = config.trailCurlScale / s;

    const push = (trails, i, bindPoint, skin, brk) => {
      if (ride) {
        trails.pushPoint(i, bindPoint, now, skin, brk);
      } else {
        skinnedPoint(bindPoint, skin, boneMatrices, worldV);
        trails.pushPoint(i, worldV, now, skin, brk);
      }
    };

    // ── Interior: curl/trails.js ──
    const { walk } = sys;
    sys.curlInterior.scale = bindCurlScale;
    const interiorStep = (config.interiorTrailSpeed * dt) / s;
    sys.interior.points.forEach((info, i) => {
      sys.curlInterior.sample3d(info.p.x, info.p.y, info.p.z, tempV);
      info.p.addScaledVector(tempV.normalize(), interiorStep * info.dir);

      if (Math.random() < config.interiorRespawnRate * dt) {
        walk.spawnInterior(info.p, info.skin, Math.random);
        info.needsBreak = true; // eslint-disable-line no-param-reassign
      }

      push(sys.interior.trails, i, info.p, info.skin, info.needsBreak);
      info.needsBreak = false; // eslint-disable-line no-param-reassign
    });

    // ── Exterior: interactiveCurl / galacticSurface ──
    sys.curlExterior.scale = bindCurlScale;
    const exteriorStep = (config.exteriorTrailSpeed * dt) / s;
    sys.exterior.points.forEach((info, i) => {
      if (info.life <= 0) {
        if (!config.exteriorAmbient) return;
        const { sp } = info;
        sp.index = walk.sampleFaceIndex(Math.random);
        walk.samplePointOnFace(sp.index, sp, Math.random);
        /* eslint-disable no-param-reassign */
        info.life =
          config.exteriorTrailLife *
          THREE.MathUtils.lerp(0.75, 1.25, Math.random());
        info.needsBreak = true;
        /* eslint-enable no-param-reassign */
      }

      const { sp } = info;
      info.life -= dt; // eslint-disable-line no-param-reassign

      sys.curlExterior.sample3d(sp.x, sp.y, sp.z, tempV);
      tempV.normalize().multiplyScalar(exteriorStep * info.dir);

      walk.getSkinAt(sp.index, sp, info.skin);
      if (info.needsBreak) {
        push(sys.exterior.trails, i, sp, info.skin, true);
        info.needsBreak = false; // eslint-disable-line no-param-reassign
      }

      walk.walker.movePoint(
        sp,
        tempV,
        sp,
        info.direction,
        normalV,
        (edgePoint) => {
          push(sys.exterior.trails, i, edgePoint, info.skin, false);
        }
      );
      push(sys.exterior.trails, i, sp, info.skin, false);

      // interactiveCurl kill conditions: stochastic death as life runs out,
      // or the field turning perpendicular to the surface.
      sys.curlExterior.sample3d(sp.x, sp.y, sp.z, tempV);
      if (
        Math.random() > info.life ||
        Math.abs(tempV.normalize().dot(normalV)) > 1 - 0.1 * Math.random()
      ) {
        info.life = 0; // eslint-disable-line no-param-reassign
      }
    });

    sys.interior.trails.flush();
    sys.exterior.trails.flush();
  });

  return <primitive object={groupRef.current} />;
}

export default memo(CurlTrails);
