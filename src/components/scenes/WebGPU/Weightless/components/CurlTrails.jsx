import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import { instancedArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

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
// - Field Lines: unbounded curl-noise walkers (curl/trails.js) — advect
//   freely along the field with random respawn. Despite spawning inside the
//   bird's volume, nothing constrains them afterward, so they wander
//   through and around it — a field-line look, not a volume fill.
// - Surface: geodesic surface walkers (surface-flow/interactiveCurl +
//   galacticSurface) — curl direction projected along the surface via
//   SurfaceWalker, life-limited with ambient respawn, plus pointer
//   stroke/burst spawning.
// - Volume Fill: genuinely bounded walkers. Each has a fixed home point
//   inside the bird (from the same interior-spawn sampling) and is
//   spring-pulled + shell-clamped around it every frame — the same
//   home/spring/shell math the GPU particle sim uses for its bound
//   particles (createParticleSimulation.js), so it actually stays inside
//   the bird instead of escaping.
// All three advect in bind-pose space; config.trailSpace decides whether
// pushed vertices are frozen in world space (CPU-skinned at push — smear)
// or re-skinned live on the GPU (ride the surface).

const FIELD_LINE_SEGMENTS = 256;
const EXTERIOR_SEGMENTS = 512;
const VOLUME_FILL_SEGMENTS = 128;

const tempV = new THREE.Vector3();
const normalV = new THREE.Vector3();
const worldV = new THREE.Vector3();
const offsetDelta = new THREE.Vector3();

function makeSkin() {
  return { si: [0, 0, 0, 0], sw: [0, 0, 0, 0] };
}

function CurlTrails({ config, meshes, birdStateRef }) {
  const groupRef = useRef(new THREE.Group());
  const systemRef = useRef(null);
  const clockRef = useRef(0);

  // Debounced counts — rebuilding allocates ring buffers.
  const [counts, setCounts] = useState({
    fieldLine: config.fieldLineCount,
    exterior: config.exteriorTrailCount,
    volumeFill: config.volumeFillCount,
  });
  useEffect(() => {
    const id = setTimeout(
      () =>
        setCounts((prev) =>
          prev.fieldLine === config.fieldLineCount &&
          prev.exterior === config.exteriorTrailCount &&
          prev.volumeFill === config.volumeFillCount
            ? prev
            : {
                fieldLine: config.fieldLineCount,
                exterior: config.exteriorTrailCount,
                volumeFill: config.volumeFillCount,
              }
        ),
      300
    );
    return () => clearTimeout(id);
  }, [
    config.fieldLineCount,
    config.exteriorTrailCount,
    config.volumeFillCount,
  ]);

  useEffect(() => {
    if (!meshes) return undefined;

    const group = groupRef.current;
    const walk = buildWalkGeometry(meshes);
    const { skeleton } = meshes[0];
    const boneBuf = instancedArray(skeleton.bones.length * 4, 'vec4');
    const shared = createSharedTrailUniforms();

    const fieldLineMat = createTrailMaterial({
      boneBuf,
      shared,
      color: config.fieldLineColor,
      opacity: config.fieldLineOpacity,
    });
    const exteriorMat = createTrailMaterial({
      boneBuf,
      shared,
      color: config.exteriorTrailColor,
      opacity: config.exteriorTrailOpacity,
    });
    const volumeFillMat = createTrailMaterial({
      boneBuf,
      shared,
      color: config.volumeFillColor,
      opacity: config.volumeFillOpacity,
    });

    const fieldLineTrails = new InstancedTrails(
      Math.max(counts.fieldLine, 1),
      FIELD_LINE_SEGMENTS,
      fieldLineMat.material
    );
    const exteriorTrails = new InstancedTrails(
      Math.max(counts.exterior, 1),
      EXTERIOR_SEGMENTS,
      exteriorMat.material
    );
    const volumeFillTrails = new InstancedTrails(
      Math.max(counts.volumeFill, 1),
      VOLUME_FILL_SEGMENTS,
      volumeFillMat.material
    );

    const fieldLinePoints = [];
    for (let i = 0; i < counts.fieldLine; i += 1) {
      const skin = makeSkin();
      const p = walk.spawnInterior(new THREE.Vector3(), skin, Math.random);
      fieldLinePoints.push({
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

    // Volume fill: home is a fixed interior anchor (bind space); offset is
    // the current wander distance from that anchor, spring-pulled and
    // shell-clamped each frame — never respawned, since the point of this
    // system is a stable population that fills the volume persistently.
    const volumeFillPoints = [];
    for (let i = 0; i < counts.volumeFill; i += 1) {
      const skin = makeSkin();
      const home = walk.spawnInterior(new THREE.Vector3(), skin, Math.random);
      volumeFillPoints.push({
        home,
        offset: new THREE.Vector3(),
        pos: home.clone(),
        skin,
        needsBreak: true,
      });
    }

    group.add(fieldLineTrails);
    group.add(exteriorTrails);
    group.add(volumeFillTrails);

    systemRef.current = {
      walk,
      skeleton,
      boneBuf,
      shared,
      curlFieldLine: new CurlGenerator(),
      curlExterior: new CurlGenerator(),
      curlVolumeFill: new CurlGenerator(),
      fieldLine: {
        trails: fieldLineTrails,
        mat: fieldLineMat,
        points: fieldLinePoints,
      },
      exterior: {
        trails: exteriorTrails,
        mat: exteriorMat,
        points: exteriorPoints,
        cursor: 0,
      },
      volumeFill: {
        trails: volumeFillTrails,
        mat: volumeFillMat,
        points: volumeFillPoints,
      },
    };

    return () => {
      group.remove(fieldLineTrails);
      group.remove(exteriorTrails);
      group.remove(volumeFillTrails);
      fieldLineTrails.dispose();
      exteriorTrails.dispose();
      volumeFillTrails.dispose();
      fieldLineMat.material.dispose();
      exteriorMat.material.dispose();
      volumeFillMat.material.dispose();
      walk.dispose();
      systemRef.current = null;
    };
  }, [meshes, counts]);

  // Switching trail space invalidates every stored vertex (different
  // coordinate space) — wipe and restart the ribbons.
  useEffect(() => {
    const sys = systemRef.current;
    if (!sys) return;
    sys.fieldLine.trails.reset();
    sys.exterior.trails.reset();
    sys.volumeFill.trails.reset();
    sys.fieldLine.points.forEach((info) => {
      info.needsBreak = true; // eslint-disable-line no-param-reassign
    });
    sys.exterior.points.forEach((info) => {
      info.needsBreak = true; // eslint-disable-line no-param-reassign
    });
    sys.volumeFill.points.forEach((info) => {
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

    sys.fieldLine.mat.uniforms.color.value.set(config.fieldLineColor);
    sys.fieldLine.mat.uniforms.opacity.value = config.fieldLineOpacity;
    sys.exterior.mat.uniforms.color.value.set(config.exteriorTrailColor);
    sys.exterior.mat.uniforms.opacity.value = config.exteriorTrailOpacity;
    sys.volumeFill.mat.uniforms.color.value.set(config.volumeFillColor);
    sys.volumeFill.mat.uniforms.opacity.value = config.volumeFillOpacity;

    const push = (trails, i, bindPoint, skin, brk) => {
      if (ride) {
        trails.pushPoint(i, bindPoint, now, skin, brk);
      } else {
        skinnedPoint(bindPoint, skin, boneMatrices, worldV);
        trails.pushPoint(i, worldV, now, skin, brk);
      }
    };

    // ── Field Lines: curl/trails.js ──
    const { walk } = sys;
    sys.curlFieldLine.scale = config.fieldLineCurlScale / s;
    const fieldLineStep = (config.fieldLineSpeed * dt) / s;
    sys.fieldLine.points.forEach((info, i) => {
      sys.curlFieldLine.sample3d(info.p.x, info.p.y, info.p.z, tempV);
      info.p.addScaledVector(tempV.normalize(), fieldLineStep * info.dir);

      if (Math.random() < config.fieldLineRespawnRate * dt) {
        walk.spawnInterior(info.p, info.skin, Math.random);
        info.needsBreak = true; // eslint-disable-line no-param-reassign
      }

      push(sys.fieldLine.trails, i, info.p, info.skin, info.needsBreak);
      info.needsBreak = false; // eslint-disable-line no-param-reassign
    });

    // ── Surface: interactiveCurl / galacticSurface ──
    sys.curlExterior.scale = config.exteriorCurlScale / s;
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

    // ── Volume Fill: home + spring + shell clamp (mirrors the GPU bound
    // particle math in createParticleSimulation.js) — bounded by
    // construction, never escapes the shell radius around its home. ──
    sys.curlVolumeFill.scale = config.volumeFillCurlScale / s;
    const volumeFlowStep = (config.volumeFillFlow * dt) / s;
    const volumeSpringFactor = Math.min(config.volumeFillSpring * dt, 1);
    const volumeShellRadius = config.volumeFillRadius / s;
    sys.volumeFill.points.forEach((info, i) => {
      const samplePos = tempV
        .copy(info.home)
        .add(info.offset)
        .addScalar(now * config.volumeFillEvolve);
      sys.curlVolumeFill.sample3d(
        samplePos.x,
        samplePos.y,
        samplePos.z,
        offsetDelta
      );
      info.offset.addScaledVector(offsetDelta, volumeFlowStep);
      info.offset.multiplyScalar(1 - volumeSpringFactor);

      const len = info.offset.length();
      if (len > volumeShellRadius) {
        info.offset.multiplyScalar(volumeShellRadius / len);
      }

      info.pos.copy(info.home).add(info.offset);
      push(sys.volumeFill.trails, i, info.pos, info.skin, info.needsBreak);
      info.needsBreak = false; // eslint-disable-line no-param-reassign
    });

    sys.fieldLine.trails.flush();
    sys.exterior.trails.flush();
    sys.volumeFill.trails.flush();
  });

  return <primitive object={groupRef.current} />;
}

export default memo(CurlTrails);
